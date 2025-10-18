"use client";

import {
  useEffect,
  useState,
  MouseEvent,
  useRef,
  ChangeEvent,
  useMemo,
} from "react";
import { socket } from "@lib/socket";
import { Path, RegisterOptions, useFieldArray, useForm } from "react-hook-form";
import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs/tabs";
import { useSession } from "next-auth/react";
import { useEditingRequests } from "@hooks/use-request-editing-rights";
import { useSocketConnection } from "@hooks/use-socket-connection";
import DescripcionDelSistema from "@components/conceptual-model/DescripcionDelSistema";
import React from "react";
import VersionBar from "@components/versions/VersionBar";
import { CLIENT_WS_EVENT_TYPES, Collaborator, InitializeConceptualModelPayload, JoinRoomEventPayload, SERVER_WS_EVENT_TYPES, SocketPosition, UsersInRoomChangePayload } from "#types/collaboration";
import { parsePropertyPath } from "@lib/utils";
import DiagramaEstructura from "@components/conceptual-model/DiagramaEstructura";
import DiagramaDinamicaEntidades from "@components/conceptual-model/DiagramaDinamicaEntidades";

function throttle(func: any, delay: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any) => {
    if (!timeout) {
      func(...args);
      timeout = setTimeout(() => {
        timeout = null;
      }, delay);
    }
  };
}

const MOUSE_POSITION_UPDATE_DELAY = 33; //30 fps

export default function Page({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { data: session } = useSession();
  const { isConnected: isSocketConnected, transport } = useSocketConnection({
    socket,
    sessionToken: session?.auth,
  });
  const { roomId } = React.use(params); // ✅ unwrap the promise

  // const [roomId, setRoomId] = useState(versionId); //esta hardcodeado -agregar el id a la ruta roomID y versionId son lo mismo
  const [currentTab, setCurrentTab] = useState("descripcion-sistema");
  const [isModelInitialized, setIsModelInitialized] = useState(false);
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    new Map()
  );
  const hasEditingRights = useMemo(() => {
    // console.log("Has Editing Rights was recalculated.");
    if (!session?.user.id) return false;
    return !!collaborators.get(session.user.id)?.hasEditingRights;
  }, [collaborators, session?.user.id]);

  const {
    canUserSendEditingRequest,
    pendingEditingRequests,
    handleCollaboratorsChange,
    handleRequestEditingRights,
    handleEditingRequestEvaluation,
  } = useEditingRequests({
    roomId,
    socket,
    userId: session?.user.id,
    hasEditingRights,
  });

  const [imageInfos, setImageInfos] = useState<Map<string, ImageInfo>>(
    new Map()
  );
  const { register, control, setValue, watch, getValues, reset } =
    useForm<ConceptualModel>();

  const simplificationList = useFieldArray({
    name: "simplifications",
    control,
  });
  const assumptionList = useFieldArray({
    name: "assumptions",
    control,
  });
  const entitiesList = useFieldArray({
    name: "entities",
    control,
  });

  const throttledEmitMouseUpdateFunction = useRef(
    throttle((roomId: string, mousePosition: any, currentTab: string) => {
      socket.volatile.emit("client-volatile-broadcast", {
        roomId,
        mousePosition,
        currentTab,
        timestamp: new Date(),
      });
    }, MOUSE_POSITION_UPDATE_DELAY)
  );

  useEffect(() => {
    if (isSocketConnected) {
      socket.emit(CLIENT_WS_EVENT_TYPES.JOIN_ROOM, {
        type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
        roomId: roomId,
        timestamp: new Date(),
      } satisfies JoinRoomEventPayload);
    }

    function onFieldUpdate(payload: { propertyPath: any; value: any }) {
      console.log(
        `Server Sent Update ${payload.propertyPath}: ${payload.value}`
      );
      const parsedPath = parsePropertyPath(getValues(), payload.propertyPath);
      setValue(parsedPath as any, payload.value);

      //objective - para acceder objetivo
      // para acceder a la image id del diagrama de estructura -- structureDiagram.imageFileId
      //suposiciones.0.description
      //
    }

    function onServerVolatileBroadcast(payload: {
      socketId: string;
      userId: string;
      currentTab: string;
      mousePosition?: { relativeX: number; relativeY: number };
    }) {
      setCollaborators((prevCollaborators) => {
        const newCollaborators = new Map<string, Collaborator>();
        for (const userId of prevCollaborators.keys()) {
          const existingCollaborator = prevCollaborators.get(userId)!;

          if (userId !== payload.userId) {
            newCollaborators.set(userId, { ...existingCollaborator });
            continue;
          }

          const newSocketPositions: Map<string, SocketPosition> = new Map();

          for (const socketId of existingCollaborator.sockets.keys()) {
            const existingSocketPosition =
              existingCollaborator.sockets.get(socketId)!;

            if (socketId === payload.socketId) {
              if (payload.mousePosition) {
                newSocketPositions.set(socketId, {
                  ...existingSocketPosition,
                  mousePosition: payload.mousePosition,
                  currentTab: payload.currentTab,
                });
              } else {
                newSocketPositions.set(socketId, {
                  ...existingSocketPosition,
                  currentTab: payload.currentTab,
                });
              }
            } else {
              newSocketPositions.set(socketId, {
                ...existingSocketPosition,
              });
            }
          }

          newCollaborators.set(userId, {
            ...existingCollaborator,
            sockets: newSocketPositions,
          });
        }
        return newCollaborators;
      });
    }

    function onUsersInRoomChange({ roomState }: UsersInRoomChangePayload) {
      // console.log("users-in-room-chage: ", roomState);
      const previousEditorUserId = collaborators
        .values()
        .find((c) => c.hasEditingRights)?.userId;
      const hasEditorChanged =
        previousEditorUserId !== roomState.currentEditingUser;
      const newCollaboratorUserIds = new Set<string>(
        roomState.collaborators.map((c) => c.userId)
      );
      setCollaborators((prevCollaborators) => {
        const newCollaborators = new Map<string, Collaborator>();
        for (const user of roomState.collaborators) {
          const existingCollaborator = prevCollaborators.get(user.userId);
          const hasEditingRights = roomState.currentEditingUser
            ? roomState.currentEditingUser === user.userId
            : false;
          const newSocketPositions: Map<string, SocketPosition> = new Map();

          if (!existingCollaborator) {
            for (const socketId of user.socketIds) {
              newSocketPositions.set(socketId, { socketId });
            }
          } else {
            for (const socketId of user.socketIds) {
              const existingSocketPosition =
                existingCollaborator.sockets.get(socketId);
              if (existingSocketPosition) {
                newSocketPositions.set(socketId, { ...existingSocketPosition });
              } else {
                newSocketPositions.set(socketId, { socketId });
              }
            }
          }

          newCollaborators.set(user.userId, {
            userId: user.userId,
            name: user.name,
            lastName: user.lastName,
            hasEditingRights,
            email: user.email,
            sockets: newSocketPositions,
          });
        }
        return newCollaborators;
      });
      handleCollaboratorsChange({
        hasEditorChanged,
        collaboratorUserIds: newCollaboratorUserIds,
      });
    }

    function onInitializeConceptualModel({
      version,
      imageInfos,
    }: InitializeConceptualModelPayload) {
      console.log("Initial State: ", version);
      const conceptualModel = version.conceptualModel;
      setTitle(version.title);
      reset(conceptualModel);
      const newImageInfos = new Map<string, ImageInfo>();
      imageInfos
        .map((i) => {
          const { id, sizeInBytes, url } = i;
          return {
            id,
            sizeInBytes,
            url,
            uploadedAt: new Date(i.createdAt),
            filename: i.originalFilename,
          };
        })
        .forEach((i) => newImageInfos.set(i.id, i));
      setImageInfos(newImageInfos);
      setIsModelInitialized(true);
    }

    function onItemAddedToList({
      listPropertyPath,
      newItem,
    }: {
      listPropertyPath: string;
      newItem: any;
    }) {
      const parsedPath: any = parsePropertyPath(getValues(), listPropertyPath);
      setValue(parsedPath, [...getValues(parsedPath), newItem]);
    }

    function onItemRemovedFromList({
      listPropertyPath,
      itemId,
    }: {
      listPropertyPath: Path<ConceptualModel>;
      itemId: string;
    }) {
      const parsedPath: any = parsePropertyPath(getValues(), listPropertyPath);
      const currentValue = getValues(listPropertyPath);
      if (Array.isArray(currentValue)) {
        setValue(parsedPath, [...currentValue.filter((s) => s._id !== itemId)]);
      }
    }

    function onPlantTextImageUpdate({
      propertyPath,
      imageUrl,
      plantTextToken,
    }: {
      propertyPath: string;
      imageUrl: string;
      plantTextToken: string;
    }) {
      console.log(`PlantText image updated for ${propertyPath}:`, imageUrl);
      // Update the plantTextToken in the form data
      const parsedPath: any = parsePropertyPath(getValues(), propertyPath);
      setValue(parsedPath, { ...getValues(parsedPath), plantTextToken });
    }

    socket.on("field-update", onFieldUpdate);
    socket.on("item-added-to-list", onItemAddedToList);
    socket.on("item-removed-from-list", onItemRemovedFromList);
    socket.on("server-volatile-broadcast", onServerVolatileBroadcast);
    socket.on(
      SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
      onInitializeConceptualModel
    );
    socket.on(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, onUsersInRoomChange);
    socket.on(SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE, onPlantTextImageUpdate);

    return () => {
      socket.off("field-update", onFieldUpdate);
      socket.off("item-added-to-list", onItemAddedToList);
      socket.off("item-removed-from-list", onItemRemovedFromList);
      socket.off("server-volatile-broadcast", onServerVolatileBroadcast);
      socket.off(
        SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
        onInitializeConceptualModel
      );
      socket.off(
        SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
        onUsersInRoomChange
      );
      socket.off(SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE, onPlantTextImageUpdate);
    };
  }, [isSocketConnected]);

  const sendPropertyUpdate = (value: any, propertyPath: string) => {
    if (!hasEditingRights) return;
    socket.emit("field-update", { roomId, propertyPath, value }); // Emit partial form data
  };

  const handleMouseMove = (e: MouseEvent) => {
    //Had to change the previous implementation because using offsetX and offsetY caused inconsistent values
    //when scrollbars appeared
    const { width, height, left, top } =
      e.currentTarget.getBoundingClientRect();
    const xPosition = e.clientX - left;
    const yPosition = e.clientY - top;

    const mousePosition = {
      relativeX: xPosition / width,
      relativeY: yPosition / height,
    };

    throttledEmitMouseUpdateFunction.current(roomId, mousePosition, currentTab);
  };

  const handleCurrentTabChange = (newTab: string) => {
    setCurrentTab(newTab);
    socket.volatile.emit("client-volatile-broadcast", {
      roomId,
      currentTab: newTab,
      timestamp: new Date(),
    });
  };

  const handleAddItemToList = ({
    e,
    listPropertyPath,
    itemType,
  }: {
    e: MouseEvent;
    listPropertyPath: string;
    itemType: "assumption" | "simplification" | "entity";
  }) => {
    e.preventDefault();
    socket.emit("add-item-to-list", { roomId, listPropertyPath, itemType });
  };

  const handleRemoveItemFromList = ({
    e,
    listPropertyPath,
    itemId,
  }: {
    e: MouseEvent;
    listPropertyPath: string;
    itemId: string;
  }) => {
    e.preventDefault();
    socket.emit("remove-item-from-list", { roomId, listPropertyPath, itemId });
  };

  const customRegisterField = ({
    name,
    propertyPath = name,
    options = {},
    propagateUpdateOnChange = false,
  }: {
    name: Path<ConceptualModel>;
    propertyPath?: string;
    options?: RegisterOptions<ConceptualModel, Path<ConceptualModel>>;
    propagateUpdateOnChange?: boolean;
  }) => {
    const { ...registerOptions } = options;

    // Get the standard register result
    const registerResult = register(name, registerOptions);

    const enhancedRegister = {
      ...registerResult,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Call the original onChange handler
        registerResult.onChange(e);

        if (propagateUpdateOnChange) {
          const value = getValues(e.currentTarget.name as any);
          sendPropertyUpdate(value, propertyPath);
        }
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Call the original onBlur handler
        registerResult.onBlur(e);

        if (!propagateUpdateOnChange) {
          const value = getValues(e.currentTarget.name as any);
          sendPropertyUpdate(value, propertyPath);
        }
      },
      readOnly: !hasEditingRights,
    };

    return enhancedRegister;
  };

  //todo: enhance error message
  if (!roomId) return <>No version ID</>;

  return (
    <div className="flex-grow bg-grey-0" onMouseMove={handleMouseMove}>
      <VersionBar
        canUserSendEditingRequest={canUserSendEditingRequest}
        handleRequestEditingRights={handleRequestEditingRights}
        pendingEditingRequests={pendingEditingRequests}
        collaborators={collaborators}
        handleEditingRequestEvaluation={handleEditingRequestEvaluation}
      title={title}
      />

      {!isModelInitialized ? (
        <p>Loading Model</p>
      ) : (
        <form
          onSubmit={(e) => {
            console.log("Form Submitted");
            e.preventDefault();
          }}
          className="flex flex-col overflow-hidden"
        >
          <br />
          <Tabs
            value={currentTab}
            onValueChange={handleCurrentTabChange}
            defaultValue="descripcion-sistema"
            orientation="vertical"
          >
            <TabsList className="h-full  flex ">
              <TabsTrigger value="descripcion-sistema" className="word-break">
                Descripción del Sistema
              </TabsTrigger>
              <TabsTrigger value="diagrama-estructura">
                Diagrama de Estructura
              </TabsTrigger>
              <TabsTrigger value="diagrama-dinamica-entidades">
              Entidades y Diagramas Dinámica
              </TabsTrigger>
              <TabsTrigger value="objetivos-entradas-salidas">
                Objetivos, Entradas y Salidas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="descripcion-sistema" className="">
              <DescripcionDelSistema
                hasEditingRights={hasEditingRights}
                assumptionList={assumptionList}
                simplificationList={simplificationList}
                watch={watch}
                customRegisterField={customRegisterField}
                handleAddItemToList={handleAddItemToList}
                handleRemoveItemFromList={handleRemoveItemFromList}
              />
            </TabsContent>
            
            <TabsContent value="diagrama-estructura" className="">
              <DiagramaEstructura
                sessionToken={session?.auth}
                versionId={roomId}
                hasEditingRights={hasEditingRights}
                imageInfos={imageInfos}
                watch={watch}
                customRegisterField={customRegisterField}
                socket={socket}
              />
            </TabsContent>

            <TabsContent value="diagrama-dinamica-entidades">
              <DiagramaDinamicaEntidades
                sessionToken={session?.auth}
                versionId={roomId}
                hasEditingRights={hasEditingRights}
                imageInfos={imageInfos}
                watch={watch}
                entitiesList={entitiesList}
                customRegisterField={customRegisterField}
                handleAddItemToList={handleAddItemToList}
                handleRemoveItemFromList={handleRemoveItemFromList}
                socket={socket}
              />
            </TabsContent>
          </Tabs>
        </form>
      )}
{/* DELETE AFTER */}
<p>Status: {isSocketConnected ? "connected" : "disconnected"}</p>
      <p>Id: {isSocketConnected ? socket.id : "No disponible"}</p>
      <p>Transport: {transport}</p>
      <p>Current Room: {roomId}</p>
      <h1>Collaborators:</h1>
      <ul>
        {Array.from(collaborators.values()).map((collaborator) => {
          return (
            <li className="ml-5" key={collaborator.userId}>
              <p>
                - User: {collaborator.userId} - Can Edit:{" "}
                {collaborator.hasEditingRights.toString()}
              </p>
              <p>
                {collaborator.name} {collaborator.lastName} -{" "}
                {collaborator.email}
              </p>
              <p>Sockets:</p>
              <ul>
                {Array.from(collaborator.sockets.values()).map((socket) => {
                  return (
                    <li className="ml-5" key={socket.socketId}>
                      <p>Socket: {socket.socketId}</p>
                      {socket.currentTab ? (
                        <p className="ml-5">Current Tab: {socket.currentTab}</p>
                      ) : (
                        <p className="ml-5"> Current Tab not available</p>
                      )}
                      {socket.mousePosition ? (
                        <p className="ml-5">
                          {" "}
                          Mouse Position: X: {
                            socket.mousePosition.relativeX
                          } Y: {socket.mousePosition.relativeY}
                        </p>
                      ) : (
                        <p className="ml-5"> Mouse Position not available</p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <br />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
