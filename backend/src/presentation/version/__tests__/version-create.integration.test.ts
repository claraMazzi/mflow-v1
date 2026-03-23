/**
 * Integration tests for version creation endpoints (Black Box / Sandbox).
 * Uses real HTTP requests (Supertest) and a real test database — no mocks for persistence.
 * Validates the public API for creating a version: blank or from an existing version.
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

describe("Version Creation API (integration)", () => {
	beforeAll(async () => {
		await connectTestDb();
	}, 15000);

	afterAll(async () => {
		await closeTestDb();
	});

	beforeEach(async () => {
		await clearVersionRelatedCollections();
	});

	describe("POST /api/versions - authentication and validation", () => {
		it("returns 401 when no Authorization header is sent", async () => {
			const res = await request(app)
				.post("/api/versions")
				.send({ title: "v1", projectId: "507f1f77bcf86cd799439011" })
				.expect(401);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/token|sesión|autenticación/i);
		});

		it("returns 401 when Authorization header is invalid", async () => {
			await request(app)
				.post("/api/versions")
				.set("Authorization", "Bearer invalid-token")
				.send({ title: "v1", projectId: "507f1f77bcf86cd799439011" })
				.expect(401);
		});

		it("returns 400 when title is missing", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ projectId })
				.expect(400);

			expect(res.body.error).toMatch(/título/i);
		});

		it("returns 400 when projectId is missing", async () => {
			const { token } = await registerAndLogin(app);

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "v1" })
				.expect(400);

			expect(res.body.error).toMatch(/proyecto/i);
		});

		it("returns 404 when project does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const fakeProjectId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "v1", projectId: fakeProjectId })
				.expect(404);

			expect(res.body.error).toMatch(/proyecto|no existe/i);
		});
	});

	describe("POST /api/versions - create blank version", () => {
		it("creates a blank version and returns 201 with version data", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Blank v1", projectId })
				.expect(201);

			expect(res.body.version).toBeDefined();
			expect(res.body.version.id).toBeDefined();
			expect(res.body.version.title).toBe("Blank v1");
			expect(res.body.version.state).toBe(VersionState.EDITABLE);
			expect(res.body.version.parentVersion).toBeNull();
		});

		it("persists the new version in the database and links it to the project", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Persisted v1", projectId })
				.expect(201);

			const versionId = res.body.version.id;

			const version = await VersionModel.findById(versionId).exec();
			expect(version).not.toBeNull();
			expect(version?.title).toBe("Persisted v1");
			expect(version?.state).toBe(VersionState.EDITABLE);
			expect(version?.parentVersion == null).toBe(true);

			const project = await ProjectModel.findById(projectId).exec();
			expect(project).not.toBeNull();
			expect(project?.versions.map((v) => v.toString())).toContain(versionId);
		});

		it("returns 400 when a version with the same title already exists in the project", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Unique title", projectId })
				.expect(201);

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Unique title", projectId })
				.expect(400);

			expect(res.body.error).toMatch(/mismo nombre|ya existe/i);
		});
	});

	describe("POST /api/versions - create version from existing (parent)", () => {
		it("returns 404 when parentVersionId does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const fakeParentId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({
					title: "Child v1",
					projectId,
					parentVersionId: fakeParentId,
				})
				.expect(404);

			expect(res.body.error).toMatch(/versión padre|no existe/i);
		});

		it("returns 400 when parent version is in EN EDICION (invalid state for parent)", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			const createRes = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Parent draft", projectId })
				.expect(201);

			const parentId = createRes.body.version.id;

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({
					title: "Child from draft",
					projectId,
					parentVersionId: parentId,
				})
				.expect(400);

			expect(res.body.error).toMatch(/estado|FINALIZADA|PENDIENTE|REVISADA/i);
		});

		it("creates a new version from a finalized parent and returns 201 with parent reference", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			const createRes = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Parent v1", projectId })
				.expect(201);

			const parentId = createRes.body.version.id;

			// Set parent to FINALIZED so it can be used as parent (no public API for this in scope; use DB for test setup)
			await VersionModel.findByIdAndUpdate(parentId, {
				state: VersionState.FINALIZED,
			}).exec();

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({
					title: "Child v2",
					projectId,
					parentVersionId: parentId,
				})
				.expect(201);

			expect(res.body.version).toBeDefined();
			expect(res.body.version.id).toBeDefined();
			expect(res.body.version.title).toBe("Child v2");
			expect(res.body.version.state).toBe(VersionState.EDITABLE);
			expect(res.body.version.parentVersion).toBeDefined();
			expect(res.body.version.parentVersion.id).toBe(parentId);
		});

		it("persists the child version with copied conceptual model and links to project", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);

			const createRes = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Parent for copy", projectId })
				.expect(201);

			const parentId = createRes.body.version.id;
			await VersionModel.findByIdAndUpdate(parentId, {
				state: VersionState.FINALIZED,
			}).exec();

			const res = await request(app)
				.post("/api/versions")
				.set("Authorization", `Bearer ${token}`)
				.send({
					title: "Child copied",
					projectId,
					parentVersionId: parentId,
				})
				.expect(201);

			const childId = res.body.version.id;

			const childVersion = await VersionModel.findById(childId)
				.lean()
				.exec();
			expect(childVersion).not.toBeNull();
			expect(childVersion?.parentVersion?.toString()).toBe(parentId);
			expect(childVersion?.conceptualModel).toBeDefined();

			const project = await ProjectModel.findById(projectId).exec();
			expect(project?.versions.map((v) => v.toString())).toContain(childId);
		});
	});
});

// --- Helpers: real API calls and DB, no mocks ---

async function registerAndLogin(
	app: ReturnType<typeof createApp>
): Promise<{ token: string; userId: string }> {
	const email = `test-${Date.now()}@example.com`;
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

	// Validate email so user can log in (direct DB update for test setup)
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
	token: string
): Promise<{ projectId: string }> {
	const res = await request(app)
		.post("/api/projects")
		.set("Authorization", `Bearer ${token}`)
		.send({
			title: `Project ${Date.now()}`,
			description: "For version tests",
		})
		.expect(201);

	// createProject returns { user: projectEntity } (project data under "user")
	const projectId = res.body.user?.id;
	expect(projectId).toBeDefined();
	return { projectId };
}
