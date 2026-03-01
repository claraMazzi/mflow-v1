/**
 * Integration tests for version delete endpoint (Black Box / Sandbox).
 * Uses real HTTP requests (Supertest) and a real test database — no mocks for persistence.
 * Validates DELETE /api/versions/:versionId (deleteVersion) for versions in "EN EDICION" state.
 */

import request from "supertest";
import mongoose from "mongoose";
import { MongoDatabase } from "../../../data";
import { createApp } from "../../create-app";
import {
	ProjectModel,
	UserModel,
	VersionModel,
	VersionState,
} from "../../../data";
import { envs } from "../../../config";

const app = createApp();

async function connectTestDb() {
	const dbName = process.env.MONGO_DB_NAME || "MFLOW_TEST";
	try {
		await MongoDatabase.connect({
			mongoUrl: envs.MONGO_URL,
			dbName,
		});
	} catch (err) {
		throw new Error(
			"Integration tests require a running MongoDB. Set MONGO_URL (and optionally MONGO_DB_NAME_TEST). " +
				(err instanceof Error ? err.message : String(err))
		);
	}
}

async function closeTestDb() {
	await mongoose.connection.close();
}

async function clearVersionRelatedCollections() {
	await VersionModel.deleteMany({});
	await ProjectModel.deleteMany({});
	await UserModel.deleteMany({});
}

async function registerAndLogin(
	app: ReturnType<typeof createApp>
): Promise<{ token: string; userId: string }> {
	const email = `test-delete-${Date.now()}@example.com`;
	const password = "Test123!";

	await request(app)
		.post("/api/auth/register")
		.send({
			name: "Test",
			lastName: "User",
			email,
			password,
			roles: ["MODELADOR"],
		})
		.expect(200);

	await UserModel.updateOne(
		{ email },
		{ $set: { emailValidated: true } }
	).exec();

	const loginRes = await request(app)
		.post("/api/auth/login")
		.send({ email, password })
		.expect(200);

	expect(loginRes.body.token).toBeDefined();
	const userId = loginRes.body.user?.id;
	expect(userId).toBeDefined();

	return { token: loginRes.body.token, userId };
}

async function createProject(
	app: ReturnType<typeof createApp>,
	token: string,
	title?: string
): Promise<{ projectId: string }> {
	const res = await request(app)
		.post("/api/projects")
		.set("Authorization", `Bearer ${token}`)
		.send({
			title: title ?? `Project delete ${Date.now()}`,
			description: "For delete tests",
		})
		.expect(201);

	const projectId = res.body.user?.id;
	expect(projectId).toBeDefined();
	return { projectId };
}

async function createVersion(
	app: ReturnType<typeof createApp>,
	token: string,
	projectId: string,
	title: string
): Promise<{ versionId: string }> {
	const res = await request(app)
		.post("/api/versions")
		.set("Authorization", `Bearer ${token}`)
		.send({ title, projectId })
		.expect(201);

	const versionId = res.body.version?.id;
	expect(versionId).toBeDefined();
	return { versionId };
}

describe("Version Delete API (integration)", () => {
	beforeAll(async () => {
		await connectTestDb();
	}, 15000);

	afterAll(async () => {
		await closeTestDb();
	});

	beforeEach(async () => {
		await clearVersionRelatedCollections();
	});

	describe("DELETE /api/versions/:versionId - authentication and authorization", () => {
		it("returns 401 when no Authorization header is sent", async () => {
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.delete(`/api/versions/${fakeVersionId}`)
				.expect(401);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/sesión|eliminar|token|autenticación/i);
		});

		it("returns 401 when Authorization header is invalid", async () => {
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			await request(app)
				.delete(`/api/versions/${fakeVersionId}`)
				.set("Authorization", "Bearer invalid-token")
				.expect(401);
		});

		it("returns 404 when version does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.delete(`/api/versions/${fakeVersionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(404);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/exist|versión|no existe/i);
		});

		it("returns 403 when user is not the project owner", async () => {
			const owner = await registerAndLogin(app);
			const otherUser = await registerAndLogin(app);

			const { projectId } = await createProject(app, owner.token);
			const { versionId } = await createVersion(
				app,
				owner.token,
				projectId,
				"Version to delete"
			);

			const res = await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${otherUser.token}`)
				.expect(403);

			expect(res.body.error).toMatch(/propietario|Solo el propietario/i);
		});
	});

	describe("DELETE /api/versions/:versionId - version state validation", () => {
		it("returns 400 when version is already ELIMINADA", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"To soft-delete"
			);

			await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			const res = await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(400);

			expect(res.body.error).toMatch(/ya fue eliminada|eliminada/i);
		});

		it("returns 400 when version is not in EN EDICION state", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Finalized version"
			);

			await VersionModel.findByIdAndUpdate(versionId, {
				$set: { state: VersionState.FINALIZED },
			}).exec();

			const res = await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(400);

			expect(res.body.error).toMatch(/en edición|sólo se puede eliminar/i);
		});
	});

	describe("DELETE /api/versions/:versionId - successful delete (EN EDICION)", () => {
		it("returns 200 with success message when deleting a version in EN EDICION as project owner", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Editable version"
			);

			const res = await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(res.body.message).toBeDefined();
			expect(res.body.message).toMatch(/eliminada|exitosamente/i);
		});

		it("soft-deletes the version (state becomes ELIMINADA) and persists in database", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"To be soft-deleted"
			);

			await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			const version = await VersionModel.findById(versionId).lean().exec();
			expect(version).not.toBeNull();
			expect(version?.state).toBe(VersionState.DELETED);
		});

		it("version remains in project versions array after soft delete", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Version in project"
			);

			await request(app)
				.delete(`/api/versions/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			const project = await ProjectModel.findById(projectId).lean().exec();
			expect(project).not.toBeNull();
			expect(project?.versions.map((v) => v.toString())).toContain(versionId);
		});
	});
});
