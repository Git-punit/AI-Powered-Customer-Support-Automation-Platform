"""
Embedding Service
Generates dense vector embeddings using Sentence Transformers
Model: all-MiniLM-L6-v2 (384 dimensions, fast & accurate)
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Union
import logging

from config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Wraps SentenceTransformer to produce normalized embeddings.
    Using all-MiniLM-L6-v2: optimized for semantic similarity tasks.
    """

    def __init__(self):
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.dimension = settings.EMBEDDING_DIMENSION
        logger.info("Embedding model loaded successfully.")

    def encode(
        self,
        texts: Union[str, List[str]],
        normalize: bool = True,
        batch_size: int = 32,
    ) -> np.ndarray:
        """
        Encode one or multiple texts into embeddings.

        Args:
            texts: Single string or list of strings
            normalize: Whether to L2-normalize (required for cosine similarity via dot product)
            batch_size: Batch size for encoding large corpora

        Returns:
            np.ndarray of shape (N, dimension) or (dimension,) for single input
        """
        if isinstance(texts, str):
            texts = [texts]
            is_single = True
        else:
            is_single = False

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=normalize,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
        )

        return embeddings[0] if is_single else embeddings

    def cosine_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """
        Compute cosine similarity between two normalized vectors.
        For L2-normalized vectors: cosine_similarity = dot_product
        """
        return float(np.dot(vec_a, vec_b))


# Singleton instance
embedding_service = EmbeddingService()
