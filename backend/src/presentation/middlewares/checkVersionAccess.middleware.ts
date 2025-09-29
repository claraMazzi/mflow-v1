import { NextFunction, Response, Request } from "express";
import { jwtAdapter } from "../../config";
import { ProjectModel, UserModel, VersionModel } from "../../data";
import { UserEntity } from "../../domain";
import { CollaborationRoom } from "../collaboration/collaborationRoom";
import { version } from "os";
import { Server as SocketIO } from "socket.io";
import mongoose from "mongoose";
import { Socket } from "dgram";
import { SocketServer } from "../socket-server";

export class CheckVersionAccessMiddleware {
	private socketServer: SocketServer;

	constructor({ socketServer }: { socketServer: SocketServer }) {
		this.socketServer = socketServer;
	}

	checkVersionExists = (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const versionId = req.params.versionId;

			if (!versionId) {
				return res.status(400).json({ error: "No version id provided." });
			}

			next();
		} catch (error) {
			console.error("middleware error", error);

			res.status(500).json({ error: "Internal server error" });
		}
	}
	//Using arrow function, to keep alive the correct "this" reference in the mehthod. JavaScript gives me headaches.
	checkIsEditorInCollaborationRoom = (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const userId = req.session?.userId!;
			const versionId = req.params.versionId;

			const roomState = this.socketServer.getCollaborationRoomState({
				roomId: versionId,
			});

			if (!roomState) {
				return res.status(404).json({
					error:
						"The collaboration room for the specified version is not currently active.",
				});
			}

			if (roomState.currentEditingUser !== userId) {
				return res.status(403).json({
					error:
						"The user doesn't have editing rights in the collaboration room for the specified version.",
				});
			}

			next();
		} catch (error) {
			console.error("middleware error", error);

			res.status(500).json({ error: "Internal server error" });
		}
	}

	checkVersionAccessForUploading = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const userId = req.session?.userId!;
		const versionId = req.params.versionId;

		try {
			const project = await ProjectModel.findOne({
				versions: new mongoose.Types.ObjectId(versionId),
			}).exec();
			if (!project) {
				return res.status(404).json({
					error:
						"The project associated with the specified version could not be found.",
				});
			}

			const isOwner = project.owner.equals(userId);

			const isCollaborator = project.collaborators.some((cId) =>
				cId.equals(userId)
			);
			if (!isOwner && !isCollaborator) {
				return res.status(403).json({
					error:
						"The user is not a collaborator in the project associated with the specified version.",
				});
			}

			next();
		} catch (error) {
			//errores no controlados
			console.error("middleware error", error);

			res.status(500).json({ error: "Internal server error" });
		}
	}
}
