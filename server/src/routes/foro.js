import express from "express";
import Foro from "../models/Foro.js";

const router = express.Router();

// Crear foro
router.post("/", async (req, res) => {
	try {
		const data = req.body;
		if (!data.key || !data.title) {
			return res.status(400).json({ error: "key_and_title_required" });
		}
		const foro = new Foro({ ...data });
		await foro.save();
		res.status(201).json(foro);
	} catch (err) {
		console.error(err);
		// mongoose duplicate key
		if (err.code === 11000) {
			return res.status(409).json({ error: "duplicate_key", details: err.message });
		}
		res.status(500).json({ error: "server_error", details: err.message });
	}
});

// Leer por id
router.get("/:id", async (req, res) => {
	try {
		const foro = await Foro.findById(req.params.id).populate("owner", "name email");
		if (!foro) return res.status(404).json({ error: "not_found" });
		res.json(foro);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Listar foros (filtros simples)
router.get("/", async (req, res) => {
	try {
		const { key, owner, visibility, q } = req.query;
		const filter = {};
		if (key) filter.key = key;
		if (owner) filter.owner = owner;
		if (visibility) filter.visibility = visibility;
		if (q) filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

		const docs = await Foro.find(filter).sort({ key: 1 }).limit(100).populate("owner", "name email");
		res.json(docs);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Actualizar
router.put("/:id", async (req, res) => {
	try {
		const foro = await Foro.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!foro) return res.status(404).json({ error: "not_found" });
		res.json(foro);
	} catch (err) {
		if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
		res.status(500).json({ error: err.message });
	}
});

// Borrar
router.delete("/:id", async (req, res) => {
	try {
		const foroId = req.params.id;
		const foro = await Foro.findById(foroId);
		if (!foro) return res.status(404).json({ error: "not_found" });

		// Import models dynamically to avoid changing top imports
		const { default: Threads } = await import("../models/Threads.js");
		const { default: Posts } = await import("../models/Posts.js");

		// Obtener hilos del foro y sus ids
		const hilos = await Threads.find({ foro: foroId }).select("_id");
		const hiloIds = hilos.map(h => h._id);

		// Borrar posts de esos hilos
		if (hiloIds.length) {
			await Posts.deleteMany({ thread: { $in: hiloIds } });
			await Threads.deleteMany({ _id: { $in: hiloIds } });
		}

		// Borrar el foro
		await foro.deleteOne();

		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;

