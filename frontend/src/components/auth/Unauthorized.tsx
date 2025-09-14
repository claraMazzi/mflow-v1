"use client"
import { Button } from "../ui/common/button";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
      <div className="w-full max-w-xl bg-white shadow-md rounded-md p-8 border border-gray-200">
        <div className="flex flex-col items-center gap-2">
          {/* Header */}
          <h1 className="text-3xl font-medium text-center text-purple-600">
            MFLOW
          </h1>

          <p>Debes iniciar sesión para poder acceder a esta página</p>
          <Button as={"a"}  href={`/login`} >
            Iniciar sesion
          </Button>
        </div>
      </div>
    </div>
  );
}
