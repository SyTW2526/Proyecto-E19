import express from "express";
import Thread from "../models/Threads.js";
import Post from "../models/Posts.js";

const router = express.Router();

// Crear thread
router.post("/", async (req, res) => {
	try {
		const data = req.body;
		if (!data.foro || !data.author || !data.title) {
			return res.status(400).json({ error: "missing_fields", details: "foro, author and title are required" });
		}
		const thread = new Thread({ ...data });
		await thread.save();
		res.status(201).json(thread);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "server_error", details: err.message });
	}
});

// Leer por id
router.get("/:id", async (req, res) => {
	try {
		const t = await Thread.findById(req.params.id)
			.populate("author", "name email")
			.populate("foro", "key title");
		if (!t) return res.status(404).json({ error: "not_found" });
		res.json(t);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Listar threads (por foro, tags, autor)
router.get("/", async (req, res) => {
	try {
		const { foro, author, tag, q, limit = 50, page = 1 } = req.query;
		const query = {};
		if (foro) query.foro = foro;
		if (author) query.author = author;
		if (tag) query.tags = tag;
		if (q) query.$text = { $search: q };

		const lim = Math.min(parseInt(limit, 10) || 50, 1000);
		const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

		const docs = await Thread.find(query)
			.sort({ sticky: -1, updatedAt: -1 })
			.skip(skip)
			.limit(lim)
			.populate("author", "name email")
			.populate("foro", "key title");
		res.json(docs);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Actualizar
router.put("/:id", async (req, res) => {
	try {
		const t = await Thread.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!t) return res.status(404).json({ error: "not_found" });
		res.json(t);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Borrar
router.delete("/:id", async (req, res) => {
	try {
		const t = await Thread.findById(req.params.id);
		if (!t) return res.status(404).json({ error: "not_found" });

		// borrar posts asociados y luego el thread
		await Post.deleteMany({ thread: t._id });
		await Thread.findByIdAndDelete(t._id);

		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
