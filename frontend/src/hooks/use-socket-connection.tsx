import { useEffect, useState } from "react";
import { Socket } from "@node_modules/socket.io-client/build/esm";

export function useSocketConnection({
	socket,
	sessionToken,
}: {
	socket: Socket;
	sessionToken: string | undefined;
}) {
	const [isConnected, setIsConnected] = useState(false); //conecta al socket 
	//TODO: Transport could probably be removed
	const [transport, setTransport] = useState("N/A");

	useEffect(() => {
		if (sessionToken) {
			socket.auth = {
				sessionToken,
			};
			socket.connect();
		}

		function onConnect() {
			setIsConnected(true);
			setTransport(socket.io.engine.transport.name);

			socket.io.engine.on("upgrade", (transport) => {
				setTransport(transport.name);
			});
		}

		function onDisconnect() {
			setIsConnected(false);
			setTransport("N/A");
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.disconnect();
		};
	}, [sessionToken]);

	return { isConnected, transport };
}
