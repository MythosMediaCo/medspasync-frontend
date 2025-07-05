import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
import jwt
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupportTicketStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class IssuePriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class SupportTicket:
    id: str
    user_id: str
    subject: str
    description: str
    status: SupportTicketStatus
    priority: IssuePriority
    category: str
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None
    satisfaction_score: Optional[int] = None

class AICustomerSupportBot:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        
        # Initialize OpenAI client
        self.openai_client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
        
        # Initialize Redis for session management
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=0,
            decode_responses=True
        )
        
        # Support knowledge base
        self.knowledge_base = self.load_knowledge_base()
        
        # Conversation context cache
        self.conversation_contexts = {}
        
        # Support ticket storage (in production, use database)
        self.support_tickets = {}
        
        # Setup routes
        self.setup_routes()
        
        logger.info("🤖 AI Customer Support Bot initialized")

    def load_knowledge_base(self) -> Dict[str, Any]:
        """Load comprehensive knowledge base for MedSpaSync Pro"""
        return {
            "product_features": {
                "reconciliation": {
                    "description": "AI-powered transaction reconciliation",
                    "common_issues": [
                        "How to import bank statements",
                        "Matching transactions manually",
                        "Understanding AI confidence scores",
                        "Exporting reconciliation reports"
                    ],
                    "solutions": {
                        "import_issues": "Ensure your bank statement is in CSV format with columns for date, description, and amount",
                        "matching_issues": "Use the bulk match feature or adjust AI confidence thresholds",
                        "export_issues": "Navigate to Reports > Reconciliation > Export"
                    }
                },
                "client_management": {
                    "description": "Comprehensive client database and relationship management",
                    "common_issues": [
                        "Adding new clients",
                        "Client data import",
                        "Client communication tools",
                        "Client history tracking"
                    ],
                    "solutions": {
                        "add_client": "Go to Clients > Add New Client or use the bulk import feature",
                        "import_data": "Use the CSV import template available in Settings > Import",
                        "communication": "Use the built-in messaging system or integrate with your existing tools"
                    }
                },
                "ai_insights": {
                    "description": "AI-powered business intelligence and analytics",
                    "common_issues": [
                        "Understanding insights",
                        "Customizing dashboards",
                        "Setting up alerts",
                        "Exporting reports"
                    ],
                    "solutions": {
                        "insights_help": "Insights are generated automatically based on your data patterns",
                        "dashboard_customization": "Click the customize button on any dashboard widget",
                        "alerts_setup": "Go to Settings > Notifications > AI Alerts"
                    }
                },
                "billing": {
                    "description": "Automated billing and subscription management",
                    "common_issues": [
                        "Updating payment methods",
                        "Changing subscription plans",
                        "Billing history access",
                        "Invoice generation"
                    ],
                    "solutions": {
                        "payment_update": "Go to Account > Billing > Payment Methods",
                        "plan_change": "Navigate to Account > Billing > Change Plan",
                        "billing_history": "Access full history in Account > Billing > History"
                    }
                }
            },
            "troubleshooting": {
                "login_issues": {
                    "symptoms": ["Can't log in", "Password reset not working", "Account locked"],
                    "solutions": [
                        "Clear browser cache and cookies",
                        "Use password reset function",
                        "Contact support if account is locked"
                    ]
                },
                "performance_issues": {
                    "symptoms": ["Slow loading", "Timeouts", "Data not syncing"],
                    "solutions": [
                        "Check internet connection",
                        "Try refreshing the page",
                        "Clear browser cache",
                        "Check if maintenance is scheduled"
                    ]
                },
                "data_issues": {
                    "symptoms": ["Missing data", "Incorrect calculations", "Sync errors"],
                    "solutions": [
                        "Verify data source connections",
                        "Check for recent imports",
                        "Run data validation tools",
                        "Contact support for data recovery"
                    ]
                }
            },
            "onboarding": {
                "getting_started": [
                    "Complete your profile setup",
                    "Import your existing data",
                    "Run your first reconciliation",
                    "Explore AI insights",
                    "Set up your team members"
                ],
                "best_practices": [
                    "Regular data backups",
                    "Consistent naming conventions",
                    "Regular reconciliation reviews",
                    "Team training sessions"
                ]
            }
        }

    def setup_routes(self):
        """Setup Flask routes for the support bot API"""
        
        @self.app.route('/api/support/chat', methods=['POST'])
        def chat_endpoint():
            return self.handle_chat_request()
        
        @self.app.route('/api/support/tickets', methods=['GET', 'POST'])
        def tickets_endpoint():
            if request.method == 'GET':
                return self.get_user_tickets()
            else:
                return self.create_support_ticket()
        
        @self.app.route('/api/support/tickets/<ticket_id>', methods=['GET', 'PUT'])
        def ticket_endpoint(ticket_id):
            if request.method == 'GET':
                return self.get_ticket(ticket_id)
            else:
                return self.update_ticket(ticket_id)
        
        @self.app.route('/api/support/knowledge', methods=['GET'])
        def knowledge_endpoint():
            return self.get_knowledge_base()
        
        @self.app.route('/api/support/health', methods=['GET'])
        def health_endpoint():
            return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

    def handle_chat_request(self):
        """Handle incoming chat messages and provide AI-powered responses"""
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            message = data.get('message')
            session_id = data.get('session_id')
            context = data.get('context', {})
            
            if not all([user_id, message, session_id]):
                return jsonify({"error": "Missing required fields"}), 400
            
            # Get conversation context
            conversation_context = self.get_conversation_context(session_id)
            
            # Analyze user intent and sentiment
            intent_analysis = self.analyze_intent(message, context)
            
            # Generate response
            response = self.generate_response(
                message, 
                intent_analysis, 
                conversation_context,
                user_id
            )
            
            # Update conversation context
            self.update_conversation_context(session_id, message, response, intent_analysis)
            
            # Check if ticket creation is needed
            if intent_analysis.get('requires_ticket'):
                ticket = self.create_auto_ticket(user_id, message, intent_analysis)
                response['ticket_created'] = ticket.id
            
            # Add helpful suggestions
            response['suggestions'] = self.generate_suggestions(intent_analysis, conversation_context)
            
            logger.info(f"💬 Chat response generated for user {user_id}")
            return jsonify(response)
            
        except Exception as e:
            logger.error(f"❌ Chat request failed: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    def analyze_intent(self, message: str, context: Dict) -> Dict[str, Any]:
        """Analyze user intent and sentiment using AI"""
        try:
            system_prompt = """
            You are an AI assistant analyzing customer support requests for MedSpaSync Pro, 
            a medical spa management platform. Analyze the user's intent, sentiment, and urgency.
            
            Return a JSON object with:
            - intent: The main purpose (question, complaint, feature_request, etc.)
            - sentiment: User's emotional state (positive, neutral, negative, frustrated)
            - urgency: How urgent the issue is (low, medium, high, critical)
            - category: Relevant product category (reconciliation, billing, client_management, etc.)
            - requires_ticket: Whether this needs a support ticket
            - confidence: Confidence score (0-1)
            - keywords: Important keywords from the message
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this message: {message}"}
                ],
                temperature=0.1,
                max_tokens=200
            )
            
            analysis = json.loads(response.choices[0].message.content)
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Intent analysis failed: {str(e)}")
            return {
                "intent": "general_question",
                "sentiment": "neutral",
                "urgency": "low",
                "category": "general",
                "requires_ticket": False,
                "confidence": 0.5,
                "keywords": []
            }

    def generate_response(self, message: str, intent_analysis: Dict, 
                         conversation_context: List, user_id: str) -> Dict[str, Any]:
        """Generate contextual and helpful AI response"""
        try:
            # Build context-aware prompt
            context_prompt = self.build_context_prompt(message, intent_analysis, conversation_context)
            
            # Get relevant knowledge base content
            knowledge_content = self.get_relevant_knowledge(intent_analysis)
            
            system_prompt = f"""
            You are a helpful, professional customer support AI for MedSpaSync Pro.
            You help medical spa owners and staff with their software questions and issues.
            
            Key principles:
            - Be empathetic and understanding
            - Provide clear, actionable solutions
            - Use simple language (avoid technical jargon)
            - Offer step-by-step guidance when needed
            - Suggest relevant features that might help
            - Always maintain HIPAA compliance awareness
            
            Relevant knowledge:
            {knowledge_content}
            
            Previous conversation context:
            {self.format_conversation_context(conversation_context)}
            
            Respond in a helpful, professional tone. If you need more information, ask clarifying questions.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            
            return {
                "response": ai_response,
                "intent": intent_analysis.get('intent'),
                "category": intent_analysis.get('category'),
                "confidence": intent_analysis.get('confidence', 0.8),
                "timestamp": datetime.now().isoformat(),
                "helpful": True,
                "requires_followup": self.needs_followup(intent_analysis)
            }
            
        except Exception as e:
            logger.error(f"❌ Response generation failed: {str(e)}")
            return {
                "response": "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team directly.",
                "intent": "error",
                "confidence": 0.0,
                "timestamp": datetime.now().isoformat(),
                "helpful": False
            }

    def build_context_prompt(self, message: str, intent_analysis: Dict, 
                           conversation_context: List) -> str:
        """Build context-aware prompt for better responses"""
        context_parts = []
        
        # Add user context
        if intent_analysis.get('category'):
            context_parts.append(f"User is asking about: {intent_analysis['category']}")
        
        if intent_analysis.get('urgency') in ['high', 'critical']:
            context_parts.append("This appears to be an urgent issue requiring immediate attention")
        
        if intent_analysis.get('sentiment') == 'frustrated':
            context_parts.append("User seems frustrated - provide extra empathy and clear solutions")
        
        # Add conversation history context
        if len(conversation_context) > 0:
            recent_topics = self.extract_recent_topics(conversation_context)
            if recent_topics:
                context_parts.append(f"Recent conversation topics: {', '.join(recent_topics)}")
        
        return "\n".join(context_parts)

    def get_relevant_knowledge(self, intent_analysis: Dict) -> str:
        """Get relevant knowledge base content based on intent analysis"""
        category = intent_analysis.get('category', 'general')
        intent = intent_analysis.get('intent', 'general_question')
        
        knowledge_content = []
        
        # Get category-specific knowledge
        if category in self.knowledge_base.get('product_features', {}):
            feature_knowledge = self.knowledge_base['product_features'][category]
            knowledge_content.append(f"Feature: {feature_knowledge['description']}")
            
            if intent == 'question':
                knowledge_content.append("Common questions and solutions:")
                for issue, solution in feature_knowledge.get('solutions', {}).items():
                    knowledge_content.append(f"- {issue}: {solution}")
        
        # Get troubleshooting knowledge
        if intent in ['complaint', 'issue']:
            for issue_type, info in self.knowledge_base.get('troubleshooting', {}).items():
                if any(symptom.lower() in intent_analysis.get('keywords', []) 
                      for symptom in info.get('symptoms', [])):
                    knowledge_content.append(f"Troubleshooting for {issue_type}:")
                    for solution in info.get('solutions', []):
                        knowledge_content.append(f"- {solution}")
        
        return "\n".join(knowledge_content)

    def get_conversation_context(self, session_id: str) -> List[Dict]:
        """Get conversation context from cache"""
        context_key = f"conversation:{session_id}"
        context_data = self.redis_client.get(context_key)
        
        if context_data:
            return json.loads(context_data)
        return []

    def update_conversation_context(self, session_id: str, user_message: str, 
                                  ai_response: Dict, intent_analysis: Dict):
        """Update conversation context in cache"""
        context_key = f"conversation:{session_id}"
        context = self.get_conversation_context(session_id)
        
        # Add new message to context
        context.append({
            "timestamp": datetime.now().isoformat(),
            "user_message": user_message,
            "ai_response": ai_response.get('response'),
            "intent": intent_analysis.get('intent'),
            "category": intent_analysis.get('category')
        })
        
        # Keep only last 10 messages for context
        if len(context) > 10:
            context = context[-10:]
        
        # Store in Redis with 1-hour expiration
        self.redis_client.setex(
            context_key,
            3600,  # 1 hour
            json.dumps(context)
        )

    def format_conversation_context(self, context: List[Dict]) -> str:
        """Format conversation context for AI prompt"""
        if not context:
            return "No previous conversation context."
        
        formatted = []
        for entry in context[-5:]:  # Last 5 messages
            formatted.append(f"User: {entry.get('user_message', '')}")
            formatted.append(f"Assistant: {entry.get('ai_response', '')}")
        
        return "\n".join(formatted)

    def extract_recent_topics(self, context: List[Dict]) -> List[str]:
        """Extract recent conversation topics"""
        topics = []
        for entry in context[-3:]:  # Last 3 messages
            category = entry.get('category')
            if category and category not in topics:
                topics.append(category)
        return topics

    def needs_followup(self, intent_analysis: Dict) -> bool:
        """Determine if the conversation needs follow-up"""
        return (
            intent_analysis.get('confidence', 0) < 0.7 or
            intent_analysis.get('urgency') in ['high', 'critical'] or
            intent_analysis.get('intent') in ['complaint', 'issue']
        )

    def generate_suggestions(self, intent_analysis: Dict, conversation_context: List) -> List[str]:
        """Generate helpful suggestions based on context"""
        suggestions = []
        category = intent_analysis.get('category')
        
        # Category-specific suggestions
        if category == 'reconciliation':
            suggestions.extend([
                "Try our bulk matching feature for faster reconciliation",
                "Check out our reconciliation best practices guide",
                "Set up automated reconciliation rules"
            ])
        elif category == 'client_management':
            suggestions.extend([
                "Explore our client communication tools",
                "Set up automated client follow-ups",
                "Import your existing client data"
            ])
        elif category == 'billing':
            suggestions.extend([
                "Review your current subscription plan",
                "Set up automated billing reminders",
                "Explore our advanced billing features"
            ])
        
        # General suggestions
        suggestions.extend([
            "Watch our getting started video",
            "Join our weekly training webinar",
            "Check out our knowledge base"
        ])
        
        return suggestions[:3]  # Return top 3 suggestions

    def create_auto_ticket(self, user_id: str, message: str, intent_analysis: Dict) -> SupportTicket:
        """Automatically create support ticket when needed"""
        ticket_id = f"TICKET_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"
        
        priority = IssuePriority.LOW
        if intent_analysis.get('urgency') == 'high':
            priority = IssuePriority.HIGH
        elif intent_analysis.get('urgency') == 'critical':
            priority = IssuePriority.URGENT
        
        ticket = SupportTicket(
            id=ticket_id,
            user_id=user_id,
            subject=f"Auto-generated: {intent_analysis.get('intent', 'Support Request')}",
            description=message,
            status=SupportTicketStatus.OPEN,
            priority=priority,
            category=intent_analysis.get('category', 'general'),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.support_tickets[ticket_id] = ticket
        logger.info(f"🎫 Auto-created ticket: {ticket_id}")
        
        return ticket

    def get_user_tickets(self):
        """Get all tickets for a user"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "User ID required"}), 400
            
            user_tickets = [
                ticket for ticket in self.support_tickets.values()
                if ticket.user_id == user_id
            ]
            
            return jsonify({
                "tickets": [
                    {
                        "id": ticket.id,
                        "subject": ticket.subject,
                        "status": ticket.status.value,
                        "priority": ticket.priority.value,
                        "category": ticket.category,
                        "created_at": ticket.created_at.isoformat(),
                        "updated_at": ticket.updated_at.isoformat()
                    }
                    for ticket in user_tickets
                ]
            })
            
        except Exception as e:
            logger.error(f"❌ Get tickets failed: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    def create_support_ticket(self):
        """Create a new support ticket"""
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            subject = data.get('subject')
            description = data.get('description')
            category = data.get('category', 'general')
            priority = data.get('priority', 'medium')
            
            if not all([user_id, subject, description]):
                return jsonify({"error": "Missing required fields"}), 400
            
            ticket_id = f"TICKET_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"
            
            ticket = SupportTicket(
                id=ticket_id,
                user_id=user_id,
                subject=subject,
                description=description,
                status=SupportTicketStatus.OPEN,
                priority=IssuePriority(priority),
                category=category,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            self.support_tickets[ticket_id] = ticket
            
            logger.info(f"🎫 Created ticket: {ticket_id}")
            
            return jsonify({
                "success": True,
                "ticket_id": ticket_id,
                "message": "Support ticket created successfully"
            })
            
        except Exception as e:
            logger.error(f"❌ Create ticket failed: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    def get_ticket(self, ticket_id: str):
        """Get specific ticket details"""
        try:
            ticket = self.support_tickets.get(ticket_id)
            if not ticket:
                return jsonify({"error": "Ticket not found"}), 404
            
            return jsonify({
                "id": ticket.id,
                "user_id": ticket.user_id,
                "subject": ticket.subject,
                "description": ticket.description,
                "status": ticket.status.value,
                "priority": ticket.priority.value,
                "category": ticket.category,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat(),
                "assigned_to": ticket.assigned_to,
                "resolution": ticket.resolution,
                "satisfaction_score": ticket.satisfaction_score
            })
            
        except Exception as e:
            logger.error(f"❌ Get ticket failed: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    def update_ticket(self, ticket_id: str):
        """Update ticket status or add resolution"""
        try:
            data = request.get_json()
            ticket = self.support_tickets.get(ticket_id)
            
            if not ticket:
                return jsonify({"error": "Ticket not found"}), 404
            
            # Update fields
            if 'status' in data:
                ticket.status = SupportTicketStatus(data['status'])
            if 'resolution' in data:
                ticket.resolution = data['resolution']
            if 'satisfaction_score' in data:
                ticket.satisfaction_score = data['satisfaction_score']
            
            ticket.updated_at = datetime.now()
            
            logger.info(f"🎫 Updated ticket: {ticket_id}")
            
            return jsonify({
                "success": True,
                "message": "Ticket updated successfully"
            })
            
        except Exception as e:
            logger.error(f"❌ Update ticket failed: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    def get_knowledge_base(self):
        """Get knowledge base content"""
        try:
            return jsonify({
                "knowledge_base": self.knowledge_base,
                "last_updated": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"❌ Get knowledge base failed: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    def run(self, host='0.0.0.0', port=5002, debug=False):
        """Run the Flask application"""
        logger.info(f"🚀 Starting AI Customer Support Bot on {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Initialize and run the bot
    support_bot = AICustomerSupportBot()
    support_bot.run(debug=True) 