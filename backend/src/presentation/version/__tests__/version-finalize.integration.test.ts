/**
 * Integration tests for version finalize endpoint (Black Box / Sandbox).
 * Uses real HTTP requests (Supertest) and a real test database — no mocks for persistence.
 * Validates POST /api/versions/:versionId/finalize (validateAndFinalizeVersion).
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
	const email = `test-finalize-${Date.now()}@example.com`;
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
	token: string
): Promise<{ projectId: string }> {
	const res = await request(app)
		.post("/api/projects")
		.set("Authorization", `Bearer ${token}`)
		.send({
			title: `Project finalize ${Date.now()}`,
			description: "For finalize tests",
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

/**
 * Minimal valid conceptual model that passes validateAndFinalizeVersion.
 * Used to test successful finalize (state -> FINALIZADA).
 */
function buildMinimalValidConceptualModel() {
	return {
		objective: "Test objective",
		name: "Test model",
		description: "Test description",
		simplifications: [],
		assumptions: [],
		structureDiagram: {
			usePlantText: true,
			plantTextCode: "@startuml\n@enduml",
			plantTextToken: "0m00",
			imageFileId: null,
		},
		flowDiagram: {
			usePlantText: true,
			plantTextCode: "@startuml\n@enduml",
			plantTextToken: "0m00",
			imageFileId: null,
		},
		inputs: [{ description: "Input 1", type: "PARAMETRO" }],
		outputs: [{ description: "Output 1", entity: "Entity1" }],
		entities: [
			{
				name: "Entity1",
				scopeDecision: {
					include: true,
					justification: "In scope",
					argumentType: "SALIDA",
				},
				dynamicDiagram: {
					usePlantText: true,
					plantTextCode: "@startuml\n@enduml",
					plantTextToken: "0m00",
					imageFileId: null,
				},
				properties: [
					{
						name: "Prop1",
						detailLevelDecision: {
							include: false,
							justification: "Justification",
							argumentType: "SIMPLIFICACION",
						},
					},
				],
			},
		],
	};
}

describe("Version Finalize API (integration)", () => {
	beforeAll(async () => {
		await connectTestDb();
	}, 15000);

	afterAll(async () => {
		await closeTestDb();
	});

	beforeEach(async () => {
		await clearVersionRelatedCollections();
	});

	describe("POST /api/versions/:versionId/finalize - authentication and validation", () => {
		it("returns 401 when no Authorization header is sent", async () => {
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post(`/api/versions/${fakeVersionId}/finalize`)
				.expect(401);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/sesión|finalizar|token|autenticación/i);
		});

		it("returns 401 when Authorization header is invalid", async () => {
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			await request(app)
				.post(`/api/versions/${fakeVersionId}/finalize`)
				.set("Authorization", "Bearer invalid-token")
				.expect(401);
		});

		it("returns 404 when version does not exist", async () => {
			const { token } = await registerAndLogin(app);
			const fakeVersionId = new mongoose.Types.ObjectId().toString();

			const res = await request(app)
				.post(`/api/versions/${fakeVersionId}/finalize`)
				.set("Authorization", `Bearer ${token}`)
				.expect(404);

			expect(res.body.error).toBeDefined();
			expect(res.body.error).toMatch(/exist|Version|versión/i);
		});
	});

	describe("POST /api/versions/:versionId/finalize - validation result (invalid model)", () => {
		it("returns 200 with isValid false and errors when finalizing a blank version", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Blank to finalize"
			);

			const res = await request(app)
				.post(`/api/versions/${versionId}/finalize`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(res.body.isValid).toBe(false);
			expect(Array.isArray(res.body.errors)).toBe(true);
			expect(res.body.errors.length).toBeGreaterThan(0);
			expect(Array.isArray(res.body.warnings)).toBe(true);

			// Blank version has empty objective, name, description; missing inputs, outputs, entities; diagram not configured
			expect(
				res.body.errors.some(
					(e: string) =>
						e.includes("objetivo") ||
						e.includes("nombre") ||
						e.includes("descripción") ||
						e.includes("entrada") ||
						e.includes("salida") ||
						e.includes("entidad") ||
						e.includes("diagrama")
				)
			).toBe(true);
		});

		it("does not change version state when validation fails", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Stay in edit"
			);

			await request(app)
				.post(`/api/versions/${versionId}/finalize`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			const version = await VersionModel.findById(versionId).lean().exec();
			expect(version).not.toBeNull();
			expect(version?.state).toBe(VersionState.EDITABLE);
		});
	});

	describe("POST /api/versions/:versionId/finalize - successful finalize", () => {
		it("returns 200 with isValid true and updates version state to FINALIZADA when model is valid", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"To finalize"
			);

			await VersionModel.findByIdAndUpdate(versionId, {
				$set: { conceptualModel: buildMinimalValidConceptualModel() },
			}).exec();

			const res = await request(app)
				.post(`/api/versions/${versionId}/finalize`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(res.body.isValid).toBe(true);
			expect(res.body.errors).toEqual([]);
			expect(Array.isArray(res.body.warnings)).toBe(true);

			const version = await VersionModel.findById(versionId).lean().exec();
			expect(version).not.toBeNull();
			expect(version?.state).toBe(VersionState.FINALIZED);
		});

		it("persists FINALIZADA state in database after successful finalize", async () => {
			const { token } = await registerAndLogin(app);
			const { projectId } = await createProject(app, token);
			const { versionId } = await createVersion(
				app,
				token,
				projectId,
				"Finalized persisted"
			);

			await VersionModel.findByIdAndUpdate(versionId, {
				$set: { conceptualModel: buildMinimalValidConceptualModel() },
			}).exec();

			await request(app)
				.post(`/api/versions/${versionId}/finalize`)
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			const version = await VersionModel.findById(versionId).exec();
			expect(version?.state).toBe(VersionState.FINALIZED);
		});
	});
});
