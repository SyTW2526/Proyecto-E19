import express from "express";
import Post from "../models/Posts.js";

const router = express.Router();

// Crear post
router.post("/", async (req, res) => {
	try {
		const data = req.body;
		if (!data.thread || !data.author || !data.body) {
			return res.status(400).json({ error: "missing_fields", details: "thread, author and body are required" });
		}
		const post = new Post({ ...data });
		await post.save();
		res.status(201).json(post);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "server_error", details: err.message });
	}
});

// Leer por id
router.get("/:id", async (req, res) => {
	try {
		const p = await Post.findById(req.params.id)
			.populate("author", "name email")
			.populate("thread", "title foro author")
			.populate("parent");
		if (!p) return res.status(404).json({ error: "not_found" });
		res.json(p);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Listar posts (por thread, author, búsqueda de texto)
router.get("/", async (req, res) => {
	try {
		const { thread, author, q, limit = 100, page = 1 } = req.query;
		const query = {};
		if (thread) query.thread = thread;
		if (author) query.author = author;
		if (q) query.$text = { $search: q };

		const lim = Math.min(parseInt(limit, 10) || 100, 1000);
		const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

		const docs = await Post.find(query)
			.sort({ createdAt: 1 })
			.skip(skip)
			.limit(lim)
			.populate("author", "name email")
			.populate("thread", "title foro");
		res.json(docs);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Actualizar
router.put("/:id", async (req, res) => {
	try {
		const p = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!p) return res.status(404).json({ error: "not_found" });
		res.json(p);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Borrar
router.delete("/:id", async (req, res) => {
	try {
		const p = await Post.findByIdAndDelete(req.params.id);
		if (!p) return res.status(404).json({ error: "not_found" });
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
