/**
 * Integration tests for request revision endpoint (Black Box / Sandbox).
 * Uses real HTTP requests (Supertest) and a real test database — no mocks for persistence.
 * Validates POST /api/revisions/request/:versionId (request verification of a finalized version).
 */

import request from "supertest";
import mongoose from "mongoose";
import { MongoDatabase } from "../../../data";
import { createApp } from "../../create-app";
import {
	ProjectModel,
	RevisionModel,
	UserModel,
	VerifierRequestModel,
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

async function clearRevisionRelatedCollections() {
	await RevisionModel.deleteMany({});
	await VerifierRequestModel.deleteMany({});
	await VersionModel.deleteMany({});
	await ProjectModel.deleteMany({});
	await UserModel.deleteMany({});
}

async function registerAndLogin(
	app: ReturnType<typeof createApp>,
	emailPrefix = "test-revision"
): Promise<{ token: string; userId: string }> {
	const email = `${emailPrefix}-${Date.now()}@example.com`;
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
			title: title ?? `Project revision ${Date.now()}`,
			description: "For request revision tests",
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

/** Creates a version in FINALIZADA state (via DB update) for request-revision tests. */
async function createFinalizedVersion(
	app: ReturnType<typeof createApp>,
	token: string,
	projectId: string,
	title: string
): Promise<{ versionId: string }> {
	const { versionId } = await createVersion(app, token, projectId, title);
	await VersionModel.findByIdAndUpdate(versionId, {
		$set: { state: VersionState.FINALIZED },
	}).exec();
	return { versionId };
}

describe("Request Revision API (integration)", () => {
	beforeAll(async () => {
		await connectTestDb();
	}, 15000);

	afterAll(async () => {
		await closeTestDb();
	});

	beforeEach(async () => {
		await clearRevisionRelatedCollections();
	});

	describe("POST /api/revisions/request/:versionId - authentication and validation", () => {
		it("returns 401 when no Authorization header is sent", async () => {
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post(`/api/revisions/request/${fakeVersionId}`)
				.send({ assignRandomVerifier: true })
				.expect(401);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/sesión|solicitar|token|autenticación/i);
		});

		it("returns 401 when Authorization header is invalid", async () => {
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			await request(app)
				.post(`/api/revisions/request/${fakeVersionId}`)
				.set("Authorization", "Bearer invalid-token")
				.send({ assignRandomVerifier: true })
				.expect(401);
		});

		it("returns 404 when version does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post(`/api/revisions/request/${fakeVersionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ assignRandomVerifier: true })
				.expect(404);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/exist|versión|no existe/i);
		});

		it("returns 400 when version is not in FINALIZADA state", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Still in edit"
			);
			// version remains in EN EDICION

			const res = await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ assignRandomVerifier: true })
				.expect(400);

			expect(res.body.error).toMatch(/FINALIZADA|solo se puede solicitar/i);
		});

		it("returns 400 when neither assignRandomVerifier nor selectedVerifierId is provided", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createFinalizedVersion(
				app,
				token,
				projectId,
				"Finalized"
			);

			const res = await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({})
				.expect(400);

			expect(res.body.error).toMatch(/verificador|seleccionar|asignar/i);
		});

		it("returns 400 when both assignRandomVerifier and selectedVerifierId are provided", async () => {
			const { token } = await registerAndLogin(app);
			const verifier = await registerAndLogin(app, "verifier");
			const { projectId } = await createProject(app, token);
			const { versionId } = await createFinalizedVersion(
				app,
				token,
				projectId,
				"Finalized"
			);

			const res = await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({
					assignRandomVerifier: true,
					selectedVerifierId: verifier.userId,
				})
				.expect(400);

			expect(res.body.error).toMatch(/ambas opciones|No puede seleccionar/i);
		});
	});

	describe("POST /api/revisions/request/:versionId - assign random verifier", () => {
		it("returns 201 with success message when requesting revision with assignRandomVerifier true", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createFinalizedVersion(
				app,
				token,
				projectId,
				"To request revision"
			);

			const res = await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ assignRandomVerifier: true })
				.expect(201);

			expect(res.body.message).toBeDefined();
			expect(res.body.message).toMatch(/revisión|exitosamente|creada/i);
		});

		it("creates a VerifierRequest and updates version state to PENDIENTE DE REVISION", async () => {
			const { token, userId } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createFinalizedVersion(
				app,
				token,
				projectId,
				"Finalized v1"
			);

			await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ assignRandomVerifier: true })
				.expect(201);

			const verifierRequest = await VerifierRequestModel.findOne({
				version: versionId,
				requestingUser: userId,
			})
				.lean()
				.exec();
			expect(verifierRequest).not.toBeNull();
			expect(verifierRequest?.state).toBe("PENDIENTE");

			const version = await VersionModel.findById(versionId).lean().exec();
			expect(version).not.toBeNull();
			expect(version?.state).toBe(VersionState.PENDING_REVIEW);
		});
	});

	describe("POST /api/revisions/request/:versionId - selected verifier", () => {
		it("returns 201 with success message when requesting revision with selectedVerifierId", async () => {
			const { token } = await registerAndLogin(app);
			const verifier = await registerAndLogin(app, "verifier");
			const { projectId } = await createProject(app, token);
			const { versionId } = await createFinalizedVersion(
				app,
				token,
				projectId,
				"Finalized v2"
			);

			const res = await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ selectedVerifierId: verifier.userId })
				.expect(201);

			expect(res.body.message).toBeDefined();
			expect(res.body.message).toMatch(/revisión|exitosamente|creada/i);
		});

		it("creates a Revision with selected verifier and updates version state to PENDIENTE DE REVISION", async () => {
			const { token } = await registerAndLogin(app);
			const verifier = await registerAndLogin(app, "verifier");
			const { projectId } = await createProject(app, token);
			const { versionId } = await createFinalizedVersion(
				app,
				token,
				projectId,
				"Finalized v3"
			);

			await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ selectedVerifierId: verifier.userId })
				.expect(201);

			const revision = await RevisionModel.findOne({
				version: versionId,
				verifier: verifier.userId,
			})
				.lean()
				.exec();
			expect(revision).not.toBeNull();
			expect(revision?.state).toBe("PENDIENTE");

			const version = await VersionModel.findById(versionId)
				.populate("revision")
				.lean()
				.exec();
			expect(version).not.toBeNull();
			expect(version?.state).toBe(VersionState.PENDING_REVIEW);
			expect((version?.revision as any)?._id?.toString()).toBe(
				revision?._id?.toString()
			);
		});
	});
});
