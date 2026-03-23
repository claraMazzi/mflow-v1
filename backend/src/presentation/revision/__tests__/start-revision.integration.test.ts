/**
 * Integration tests for creating and starting a revision (Black Box / Sandbox).
 * Uses real HTTP requests (Supertest) and a real test database — no mocks for persistence.
 * - Creating a revision: POST /api/revisions/request/:versionId (with selectedVerifierId).
 * - Starting a revision: POST /api/revisions/:revisionId/start (PENDIENTE -> EN CURSO).
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
	emailPrefix = "test-start-rev"
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
			title: title ?? `Project start-rev ${Date.now()}`,
			description: "For start revision tests",
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

/** Creates a version in FINALIZADA state for request-revision flow. */
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

/**
 * Request revision with a selected verifier; returns the created revision id from DB
 * (API does not return revisionId; we fetch the revision by version + verifier).
 */
async function requestRevisionWithVerifier(
	app: ReturnType<typeof createApp>,
	ownerToken: string,
	versionId: string,
	verifierUserId: string
): Promise<{ revisionId: string }> {
	await request(app)
		.post(`/api/revisions/request/${versionId}`)
		.set("Authorization", `Bearer ${ownerToken}`)
		.send({ selectedVerifierId: verifierUserId })
		.expect(201);

	const revision = await RevisionModel.findOne({
		version: versionId,
		verifier: verifierUserId,
	})
		.lean()
		.exec();
	expect(revision).not.toBeNull();
	return { revisionId: revision!._id.toString() };
}

describe("Create and Start Revision API (integration)", () => {
	beforeAll(async () => {
		await connectTestDb();
	}, 15000);

	afterAll(async () => {
		await closeTestDb();
	});

	beforeEach(async () => {
		await clearRevisionRelatedCollections();
	});

	describe("POST /api/revisions/:revisionId/start - authentication and authorization", () => {
		it("returns 401 when no Authorization header is sent", async () => {
			const fakeRevisionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post(`/api/revisions/${fakeRevisionId}/start`)
				.expect(401);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/sesión|iniciar|token|autenticación/i);
		});

		it("returns 401 when Authorization header is invalid", async () => {
			const fakeRevisionId = new mongoose.Types.ObjectId().toString();

			await request(app)
				.post(`/api/revisions/${fakeRevisionId}/start`)
				.set("Authorization", "Bearer invalid-token")
				.expect(401);
		});

		it("returns 404 when revision does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const fakeRevisionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post(`/api/revisions/${fakeRevisionId}/start`)
				.set("Authorization", `Bearer ${token}`)
				.expect(404);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/exist|revisión|no existe/i);
		});

		it("returns 403 when user is not the verifier assigned to the revision", async () => {
			const owner = await registerAndLogin(app, "owner");
			const verifier = await registerAndLogin(app, "verifier");
			const otherUser = await registerAndLogin(app, "other");

			const { projectId } = await createProject(app, owner.token);
			const { versionId } = await createFinalizedVersion(
				app,
				owner.token,
				projectId,
				"Finalized"
			);
			const { revisionId } = await requestRevisionWithVerifier(
				app,
				owner.token,
				versionId,
				verifier.userId
			);

			const res = await request(app)
				.post(`/api/revisions/${revisionId}/start`)
				.set("Authorization", `Bearer ${otherUser.token}`)
				.expect(403);

			expect(res.body.error).toMatch(/permisos|iniciar esta revisión/i);
		});
	});

	describe("POST /api/revisions/:revisionId/start - revision state", () => {
		it("returns 400 when revision is not in PENDIENTE state", async () => {
			const owner = await registerAndLogin(app, "owner");
			const verifier = await registerAndLogin(app, "verifier");

			const { projectId } = await createProject(app, owner.token);
			const { versionId } = await createFinalizedVersion(
				app,
				owner.token,
				projectId,
				"Finalized"
			);
			const { revisionId } = await requestRevisionWithVerifier(
				app,
				owner.token,
				versionId,
				verifier.userId
			);

			// Start once (PENDIENTE -> EN CURSO)
			await request(app)
				.post(`/api/revisions/${revisionId}/start`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.expect(200);

			// Try to start again
			const res = await request(app)
				.post(`/api/revisions/${revisionId}/start`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.expect(400);

			expect(res.body.error).toMatch(/PENDIENTE|solo se puede iniciar/i);
		});
	});

	describe("POST /api/revisions/:revisionId/start - successful start", () => {
		it("returns 200 with success message when verifier starts a PENDIENTE revision", async () => {
			const owner = await registerAndLogin(app, "owner");
			const verifier = await registerAndLogin(app, "verifier");

			const { projectId } = await createProject(app, owner.token);
			const { versionId } = await createFinalizedVersion(
				app,
				owner.token,
				projectId,
				"Finalized"
			);
			const { revisionId } = await requestRevisionWithVerifier(
				app,
				owner.token,
				versionId,
				verifier.userId
			);

			const res = await request(app)
				.post(`/api/revisions/${revisionId}/start`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.expect(200);

			expect(res.body.message).toBeDefined();
			expect(res.body.message).toMatch(/iniciada|exitosamente/i);
		});

		it("updates revision state to EN CURSO in database", async () => {
			const owner = await registerAndLogin(app, "owner");
			const verifier = await registerAndLogin(app, "verifier");

			const { projectId } = await createProject(app, owner.token);
			const { versionId } = await createFinalizedVersion(
				app,
				owner.token,
				projectId,
				"Finalized"
			);
			const { revisionId } = await requestRevisionWithVerifier(
				app,
				owner.token,
				versionId,
				verifier.userId
			);

			await request(app)
				.post(`/api/revisions/${revisionId}/start`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.expect(200);

			const revision = await RevisionModel.findById(revisionId).lean().exec();
			expect(revision).not.toBeNull();
			expect(revision?.state).toBe("EN CURSO");
		});
	});

	describe("Full flow: create revision then start revision", () => {
		it("owner requests revision with selected verifier, then verifier starts the revision", async () => {
			const owner = await registerAndLogin(app, "owner");
			const verifier = await registerAndLogin(app, "verifier");

			const { projectId } = await createProject(app, owner.token);
			const { versionId } = await createFinalizedVersion(
				app,
				owner.token,
				projectId,
				"To verify"
			);

			// 1. Create revision (request revision)
			await request(app)
				.post(`/api/revisions/request/${versionId}`)
				.set("Authorization", `Bearer ${owner.token}`)
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

			const revisionId = revision!._id.toString();

			// 2. Verifier starts the revision
			const startRes = await request(app)
				.post(`/api/revisions/${revisionId}/start`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.expect(200);

			expect(startRes.body.message).toMatch(/iniciada|exitosamente/i);

			const updated = await RevisionModel.findById(revisionId).lean().exec();
			expect(updated?.state).toBe("EN CURSO");
		});
	});
});
