class ConfidenceBasedDecisionEngine:
    """Decision engine to categorize predictions based on confidence."""

    def decide(self, score: float) -> str:
        if score >= 0.95:
            return "auto_approved"
        if score >= 0.75:
            return "needs_review"
        return "rejected"
