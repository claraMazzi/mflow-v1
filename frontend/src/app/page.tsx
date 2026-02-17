import Link from "next/link";
import {
	GitBranch,
	FileCheck,
	Users,
	ClipboardList,
	ArrowRight,
	Layers,
} from "lucide-react";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
			{/* Hero */}
			<header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
					<h1 className="font-heading text-2xl font-semibold text-purple-700">
						Mflow
					</h1>
					<Link
						href="/login"
						className="rounded-md bg-purple-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-purple-600"
					>
						Iniciar sesión
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-6 py-12 md:py-20">
				{/* Hero banner */}
				<section className="mb-16 rounded-xl border border-purple-100 bg-white p-8 shadow-sm md:p-12">
					<h2 className="font-heading mb-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
						Genera y versiona modelos de simulación
					</h2>
					<p className="mb-8 max-w-2xl text-lg text-muted-foreground">
						Mflow te permite crear modelos conceptuales, trabajar en versiones,
						solicitar revisiones por verificadores y mantener un historial claro
						de cambios.
					</p>
					<Link
						href="/login"
						className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-5 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-purple-600"
					>
						Acceder a Mflow
						<ArrowRight className="h-4 w-4" />
					</Link>
				</section>

				{/* Versioning model section */}
				<h2 className="font-heading mb-8 text-2xl font-bold text-gray-900">
					Modelo de versionado
				</h2>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{/* Version states */}
					<section className="flex flex-col rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
							<Layers className="h-5 w-5 text-purple-700" />
						</div>
						<h3 className="font-heading mb-2 text-lg font-semibold text-gray-900">
							Estados de versión
						</h3>
						<p className="text-sm text-muted-foreground">
							Cada versión recorre estados: <strong>En edición</strong>,{" "}
							<strong>Finalizada</strong>, <strong>Pendiente de revisión</strong>{" "}
							y <strong>Revisada</strong>. Solo las versiones finalizadas o
							revisadas pueden usarse como base para nuevas versiones.
						</p>
					</section>

					{/* Parent version / branching */}
					<section className="flex flex-col rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
							<GitBranch className="h-5 w-5 text-purple-700" />
						</div>
						<h3 className="font-heading mb-2 text-lg font-semibold text-gray-900">
							Ramificación desde una versión padre
						</h3>
						<p className="text-sm text-muted-foreground">
							Puedes crear una nueva versión a partir de una versión padre
							finalizada o revisada. Se copia el modelo conceptual y, opcionalmente,
							los ítems de tareas, manteniendo un árbol de versiones trazable.
						</p>
					</section>

					{/* Revisions */}
					<section className="flex flex-col rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
							<FileCheck className="h-5 w-5 text-purple-700" />
						</div>
						<h3 className="font-heading mb-2 text-lg font-semibold text-gray-900">
							Revisiones y verificadores
						</h3>
						<p className="text-sm text-muted-foreground">
							Las versiones pueden enviarse a revisión. Un verificador asigna
							correcciones por sección del modelo. Las revisiones tienen estado
							(Pendiente, En curso, Finalizada) y una devolución final.
						</p>
					</section>

					{/* Conceptual model */}
					<section className="flex flex-col rounded-xl border border-purple-100 bg-white p-6 shadow-sm md:col-span-2">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
							<ClipboardList className="h-5 w-5 text-purple-700" />
						</div>
						<h3 className="font-heading mb-2 text-lg font-semibold text-gray-900">
							Modelo conceptual
						</h3>
						<p className="text-sm text-muted-foreground">
							Cada versión contiene un modelo conceptual (descripción del sistema,
							objetivos, entradas y salidas, alcance, diagramas de estructura y
							flujo, etc.). El contenido se edita en la versión en estado &quot;En
							edición&quot; y se preserva al crear versiones hijas.
						</p>
					</section>

					{/* Sharing */}
					<section className="flex flex-col rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
							<Users className="h-5 w-5 text-purple-700" />
						</div>
						<h3 className="font-heading mb-2 text-lg font-semibold text-gray-900">
							Compartir versiones
						</h3>
						<p className="text-sm text-muted-foreground">
							Las versiones finalizadas o en revisión pueden compartirse con
							lectores mediante enlaces, para dar acceso de solo lectura sin
							editar.
						</p>
					</section>
				</div>

				{/* Bottom CTA banner */}
				<section className="mt-16 rounded-xl border border-purple-200 bg-purple-50 p-8 text-center md:p-12">
					<h2 className="font-heading mb-3 text-2xl font-bold text-gray-900">
						¿Listo para empezar?
					</h2>
					<p className="mb-6 text-muted-foreground">
						Inicia sesión para crear proyectos, versiones y solicitar revisiones.
					</p>
					<Link
						href="/login"
						className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-5 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-purple-600"
					>
						Iniciar sesión
						<ArrowRight className="h-4 w-4" />
					</Link>
				</section>
			</main>

			<footer className="border-t border-purple-100 bg-white py-6">
				<div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
					Mflow — Genera y versiona modelos de simulación
				</div>
			</footer>
		</div>
	);
}
