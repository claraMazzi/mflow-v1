/**
 * Integration tests for modifying a revision in progress - save corrections (Black Box / Sandbox).
 * Uses real HTTP requests (Supertest) and a real test database — no mocks for persistence.
 * Validates PUT /api/revisions/:revisionId/corrections (save/update corrections while revision is EN CURSO).
 */

import request from "supertest";
import mongoose from "mongoose";
import { MongoDatabase } from "../../../data";
import { createApp } from "../../create-app";
import {
	RevisionModel,
	UserModel,
	VerifierRequestModel,
	VersionModel,
	VersionState,
	ProjectModel,
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
	emailPrefix = "test-save-corr"
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
			title: title ?? `Project save-corr ${Date.now()}`,
			description: "For save corrections tests",
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

async function startRevision(
	app: ReturnType<typeof createApp>,
	verifierToken: string,
	revisionId: string
): Promise<void> {
	await request(app)
		.post(`/api/revisions/${revisionId}/start`)
		.set("Authorization", `Bearer ${verifierToken}`)
		.expect(200);
}

const validCorrections = [
	{
		description: "Corrección de ejemplo",
		location: { x: 10, y: 20, page: 1 },
	},
];

describe("Save Corrections (modify revision in progress) API (integration)", () => {
	beforeAll(async () => {
		await connectTestDb();
	}, 15000);

	afterAll(async () => {
		await closeTestDb();
	});

	beforeEach(async () => {
		await clearRevisionRelatedCollections();
	});

	describe("PUT /api/revisions/:revisionId/corrections - authentication and authorization", () => {
		it("returns 401 when no Authorization header is sent", async () => {
			const fakeRevisionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.put(`/api/revisions/${fakeRevisionId}/corrections`)
				.send({ corrections: validCorrections })
				.expect(401);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/sesión|guardar|token|autenticación/i);
		});

		it("returns 401 when Authorization header is invalid", async () => {
			const fakeRevisionId = new mongoose.Types.ObjectId().toString();

			await request(app)
				.put(`/api/revisions/${fakeRevisionId}/corrections`)
				.set("Authorization", "Bearer invalid-token")
				.send({ corrections: validCorrections })
				.expect(401);
		});

		it("returns 404 when revision does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const fakeRevisionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.put(`/api/revisions/${fakeRevisionId}/corrections`)
				.set("Authorization", `Bearer ${token}`)
				.send({ corrections: validCorrections })
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
			await startRevision(app, verifier.token, revisionId);

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${otherUser.token}`)
				.send({ corrections: validCorrections })
				.expect(403);

			expect(res.body.error).toMatch(/permisos|modificar esta revisión/i);
		});
	});

	describe("PUT /api/revisions/:revisionId/corrections - body validation", () => {
		it("returns 400 when corrections is not an array", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: "not-an-array" })
				.expect(400);

			expect(res.body.error).toMatch(/arreglo|correcciones/i);
		});

		it("returns 400 when a correction is missing description", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({
					corrections: [{ location: { x: 0, y: 0, page: 1 } }],
				})
				.expect(400);

			expect(res.body.error).toMatch(/corrección|descripción/i);
		});

		it("returns 400 when a correction is missing valid location", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({
					corrections: [{ description: "Ok", location: { x: 0 } }],
				})
				.expect(400);

			expect(res.body.error).toMatch(/ubicación|ubicación válida/i);
		});
	});

	describe("PUT /api/revisions/:revisionId/corrections - revision state", () => {
		it("returns 400 when revision is not in EN CURSO state", async () => {
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
			// Do NOT start — revision stays PENDIENTE

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: validCorrections })
				.expect(400);

			expect(res.body.error).toMatch(/EN CURSO|solo se pueden modificar/i);
		});
	});

	describe("PUT /api/revisions/:revisionId/corrections - successful save", () => {
		it("returns 200 with message and corrections when verifier saves corrections on EN CURSO revision", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			const corrections = [
				{
					description: "Primera corrección",
					location: { x: 5, y: 10, page: 1 },
				},
				{
					description: "Segunda corrección",
					location: { x: 20, y: 30, page: 2 },
				},
			];

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections })
				.expect(200);

			expect(res.body.message).toBeDefined();
			expect(res.body.message).toMatch(/guardadas|exitosamente/i);
			expect(Array.isArray(res.body.corrections)).toBe(true);
			expect(res.body.corrections.length).toBe(2);
			expect(res.body.corrections[0].description).toBe(corrections[0].description);
			expect(res.body.corrections[1].description).toBe(corrections[1].description);
		});

		it("persists corrections in database and keeps revision in EN CURSO", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: validCorrections })
				.expect(200);

			const revision = await RevisionModel.findById(revisionId).lean().exec();
			expect(revision).not.toBeNull();
			expect(revision?.state).toBe("EN CURSO");
			expect(revision?.corrections).toHaveLength(validCorrections.length);
			expect(revision?.corrections?.[0].description).toBe(
				validCorrections[0].description
			);
		});

		it("allows updating corrections again (modify in progress)", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			const firstBatch = [
				{
					description: "Corrección inicial",
					location: { x: 1, y: 2, page: 1 },
				},
			];

			await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: firstBatch })
				.expect(200);

			const secondBatch = [
				{
					description: "Corrección actualizada",
					location: { x: 10, y: 20, page: 1 },
				},
				{
					description: "Nueva corrección",
					location: { x: 30, y: 40, page: 2 },
				},
			];

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: secondBatch })
				.expect(200);

			expect(res.body.corrections.length).toBe(2);
			expect(res.body.corrections[0].description).toBe("Corrección actualizada");
			expect(res.body.corrections[1].description).toBe("Nueva corrección");

			const revision = await RevisionModel.findById(revisionId).lean().exec();
			expect(revision?.corrections).toHaveLength(2);
		});

		it("accepts empty corrections array (clears corrections)", async () => {
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
			await startRevision(app, verifier.token, revisionId);

			await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: validCorrections })
				.expect(200);

			const res = await request(app)
				.put(`/api/revisions/${revisionId}/corrections`)
				.set("Authorization", `Bearer ${verifier.token}`)
				.send({ corrections: [] })
				.expect(200);

			expect(res.body.corrections).toEqual([]);

			const revision = await RevisionModel.findById(revisionId).lean().exec();
			expect(revision?.corrections).toHaveLength(0);
		});
	});
});
