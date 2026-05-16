"""Throttle classes for learning flow endpoints."""
from rest_framework.throttling import UserRateThrottle


class LearningSessionStartRateThrottle(UserRateThrottle):
    scope = "learning_session_start"


class LearningSessionAnswerBurstThrottle(UserRateThrottle):
    scope = "learning_session_answer_burst"


class LearningSessionAnswerSustainedThrottle(UserRateThrottle):
    scope = "learning_session_answer_sustained"


class LearningSessionFinishRateThrottle(UserRateThrottle):
    scope = "learning_session_finish"


class LearningSessionQuitRateThrottle(UserRateThrottle):
    scope = "learning_session_quit"


class LearningCheckpointStartRateThrottle(UserRateThrottle):
    scope = "learning_checkpoint_start"


class LearningCheckpointSubmitRateThrottle(UserRateThrottle):
    scope = "learning_checkpoint_submit"


class LearningAnalyticsReadRateThrottle(UserRateThrottle):
    scope = "learning_analytics_read"
