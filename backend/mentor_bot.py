"""
Animal Mentor Bot System for Job Automation AI
Provides personalized guidance and encouragement throughout the job application process
"""

import random
from typing import Dict, List, Optional
from enum import Enum

class MentorAnimal(Enum):
    DOLPHIN = "dolphin"
    OWL = "owl"
    EAGLE = "eagle"
    WOLF = "wolf"
    PANDA = "panda"
    LION = "lion"
    ELEPHANT = "elephant"
    FOX = "fox"

class MentorBot:
    def __init__(self, animal: MentorAnimal = MentorAnimal.DOLPHIN):
        self.animal = animal
        self.personality = self._get_personality()
        self.messages = self._get_messages()

    def _get_personality(self) -> Dict:
        personalities = {
            MentorAnimal.DOLPHIN: {
                "traits": ["intelligent", "playful", "supportive", "adaptive"],
                "tone": "friendly and encouraging",
                "expertise": "communication and networking"
            },
            MentorAnimal.OWL: {
                "traits": ["wise", "analytical", "patient", "strategic"],
                "tone": "thoughtful and insightful",
                "expertise": "resume optimization and career planning"
            },
            MentorAnimal.EAGLE: {
                "traits": ["focused", "determined", "visionary", "ambitious"],
                "tone": "motivational and goal-oriented",
                "expertise": "job hunting strategy and interview prep"
            },
            MentorAnimal.WOLF: {
                "traits": ["loyal", "persistent", "collaborative", "intuitive"],
                "tone": "supportive and team-oriented",
                "expertise": "networking and professional relationships"
            },
            MentorAnimal.PANDA: {
                "traits": ["calm", "gentle", "methodical", "balanced"],
                "tone": "soothing and patient",
                "expertise": "stress management and work-life balance"
            },
            MentorAnimal.LION: {
                "traits": ["confident", "bold", "leadership", "charismatic"],
                "tone": "inspiring and powerful",
                "expertise": "leadership roles and executive positions"
            },
            MentorAnimal.ELEPHANT: {
                "traits": ["wise", "reliable", "memory", "experienced"],
                "tone": "mentoring and experienced",
                "expertise": "career transitions and long-term planning"
            },
            MentorAnimal.FOX: {
                "traits": ["clever", "adaptable", "resourceful", "quick"],
                "tone": "smart and witty",
                "expertise": "tech roles and creative problem solving"
            }
        }
        return personalities.get(self.animal, personalities[MentorAnimal.DOLPHIN])

    def _get_messages(self) -> Dict:
        base_messages = {
            "welcome": [
                f"Hi there! I'm your {self.animal.value} mentor. Let's make your job search amazing!",
                f"Welcome aboard! As your {self.animal.value} guide, I'm here to help you succeed!",
                f"Great to meet you! I'm excited to be your {self.animal.value} mentor on this journey!"
            ],
            "resume_upload": [
                "Let's start with your resume - the foundation of your job search!",
                "Time to showcase your amazing skills! Upload your resume and let's make it shine.",
                "Your resume tells your story. Let's make sure it's compelling!"
            ],
            "questionnaire": [
                "These questions help me understand you better so I can give personalized advice.",
                "Let's gather some key information to tailor your job applications perfectly.",
                "The more I know about your goals, the better I can guide you!"
            ],
            "profile_picture": [
                "A professional photo makes a great first impression!",
                "Your profile picture is your digital handshake - make it count!",
                "Adding a photo helps employers connect with the person behind the resume."
            ],
            "certifications": [
                "Certifications show your commitment to professional growth!",
                "These credentials can set you apart from other candidates.",
                "Your certifications demonstrate expertise - let's highlight them!"
            ],
            "education": [
                "Your educational background builds credibility with employers.",
                "Education shows your foundation - let's make sure it's complete!",
                "Academic achievements deserve to be showcased properly."
            ],
            "job_search": [
                "Time to find your perfect job match! I'll help you search smart.",
                "Let's discover opportunities that align with your skills and goals.",
                "The job market is full of possibilities - let's explore them together!"
            ],
            "application_success": [
                "Fantastic! Another application submitted successfully!",
                "Great job! You're one step closer to your dream role.",
                "Excellent work! Your persistence is paying off."
            ],
            "application_error": [
                "Don't worry, we'll try again. Every challenge is a learning opportunity!",
                "That's okay - let's adjust our approach and keep moving forward.",
                "No problem! I'll help you troubleshoot and get back on track."
            ],
            "encouragement": [
                "You're doing great! Job searching takes patience, but you've got this!",
                "Remember, every 'no' brings you closer to the perfect 'yes'!",
                "Your dedication is inspiring. Keep up the excellent work!"
            ],
            "interview_prep": [
                "Interview time! Let's prepare you to shine and show your best self.",
                "Interviews are conversations, not interrogations. You've got this!",
                "Time to showcase why you're the perfect fit for this role!"
            ]
        }

        # Add animal-specific variations
        animal_specific = {
            MentorAnimal.DOLPHIN: {
                "encouragement": [
                    "Dive deep into opportunities! Like me, you're smart and adaptable.",
                    "Navigate the job market with grace - you're making waves!",
                    "Stay curious and playful in your approach. The best opportunities come to those who explore!"
                ]
            },
            MentorAnimal.OWL: {
                "encouragement": [
                    "Wisdom comes from experience. Each application teaches you something valuable.",
                    "Like a wise owl, you're gathering knowledge with every step.",
                    "Your analytical approach will lead to the right opportunity. Stay patient and observant."
                ]
            },
            MentorAnimal.EAGLE: {
                "encouragement": [
                    "Soar high and keep your eyes on the prize! Your determination will pay off.",
                    "Like an eagle, you have the vision to spot the perfect opportunity.",
                    "Rise above the competition with your focused approach and sharp skills!"
                ]
            },
            MentorAnimal.WOLF: {
                "encouragement": [
                    "Persistence is your strength. Keep hunting for that perfect role!",
                    "Trust your instincts - they'll lead you to the right pack.",
                    "Your loyalty and teamwork make you an invaluable addition to any company."
                ]
            },
            MentorAnimal.PANDA: {
                "encouragement": [
                    "Take it one step at a time. Balance and patience lead to success.",
                    "Stay calm and centered. The right opportunity will come when the time is right.",
                    "Your gentle persistence and methodical approach are your greatest strengths."
                ]
            },
            MentorAnimal.LION: {
                "encouragement": [
                    "Lead with confidence! You have the presence to command any room.",
                    "Your leadership qualities shine through. Companies need someone like you!",
                    "Roar with confidence! You're destined for great things."
                ]
            },
            MentorAnimal.ELEPHANT: {
                "encouragement": [
                    "Your experience and wisdom are invaluable assets. Trust in your journey.",
                    "Like an elephant, you never forget the lessons learned. Apply them to find success!",
                    "Your reliability and steady approach will attract the right employers."
                ]
            },
            MentorAnimal.FOX: {
                "encouragement": [
                    "Stay clever and adaptable! Your quick thinking sets you apart.",
                    "Like a fox, you're resourceful and smart. Use those skills to your advantage!",
                    "Your creativity and problem-solving abilities are exactly what companies need."
                ]
            }
        }

        # Merge animal-specific messages
        for key, messages in base_messages.items():
            if self.animal in animal_specific and key in animal_specific[self.animal]:
                messages.extend(animal_specific[self.animal][key])

        return base_messages

    def get_message(self, context: str, custom_data: Optional[Dict] = None) -> str:
        """Get a contextual message from the mentor bot"""
        messages = self.messages.get(context, self.messages["encouragement"])
        base_message = random.choice(messages)

        # Add personalization if custom data is provided
        if custom_data:
            if "name" in custom_data:
                base_message = f"{custom_data['name']}, {base_message.lower()}"
            if "job_count" in custom_data and context == "job_search":
                base_message += f" I found {custom_data['job_count']} great matches for you!"
            if "success_rate" in custom_data and context == "encouragement":
                if custom_data["success_rate"] > 70:
                    base_message += " Your success rate is impressive!"
                elif custom_data["success_rate"] > 40:
                    base_message += " You're making steady progress!"

        return base_message

    def get_tip_of_the_day(self) -> str:
        """Get a daily tip based on the mentor's expertise"""
        tips = {
            MentorAnimal.DOLPHIN: [
                "Tip: Customize your LinkedIn message when connecting with recruiters!",
                "Tip: Join industry groups and participate in discussions to boost visibility.",
                "Tip: Follow up on applications with a personalized thank you message."
            ],
            MentorAnimal.OWL: [
                "Tip: Use action verbs and quantify achievements in your resume.",
                "Tip: Research the company culture before applying to ensure alignment.",
                "Tip: Keep your resume to 1-2 pages and focus on relevant experience."
            ],
            MentorAnimal.EAGLE: [
                "Tip: Set daily application goals and track your progress.",
                "Tip: Practice the STAR method for behavioral interview questions.",
                "Tip: Research your interviewers on LinkedIn before the meeting."
            ],
            MentorAnimal.WOLF: [
                "Tip: Leverage your professional network - 70% of jobs aren't publicly posted!",
                "Tip: Attend virtual networking events in your industry.",
                "Tip: Ask for informational interviews to learn about companies."
            ],
            MentorAnimal.PANDA: [
                "Tip: Take breaks between applications to avoid burnout.",
                "Tip: Set realistic daily goals and celebrate small wins.",
                "Tip: Practice mindfulness to stay calm during interviews."
            ],
            MentorAnimal.LION: [
                "Tip: Highlight leadership experiences and quantify your impact.",
                "Tip: Research executive team backgrounds on company websites.",
                "Tip: Prepare questions that show strategic thinking during interviews."
            ],
            MentorAnimal.ELEPHANT: [
                "Tip: Leverage your experience by mentioning transferable skills.",
                "Tip: Consider companies going through transitions - they value experience.",
                "Tip: Share stories that demonstrate wisdom and reliability."
            ],
            MentorAnimal.FOX: [
                "Tip: Showcase creative problem-solving in your portfolio or examples.",
                "Tip: Stay updated on industry trends and emerging technologies.",
                "Tip: Demonstrate adaptability with examples from different projects."
            ]
        }

        return random.choice(tips.get(self.animal, tips[MentorAnimal.DOLPHIN]))

    def get_avatar_url(self) -> str:
        """Get the avatar URL for the mentor animal"""
        return f"/static/avatars/{self.animal.value}.png"

    def get_personality_description(self) -> str:
        """Get a description of the mentor's personality"""
        traits = ", ".join(self.personality["traits"])
        return f"I'm {traits} and my expertise is in {self.personality['expertise']}. My tone is {self.personality['tone']}."

class MentorBotManager:
    """Manages mentor bot selection and interactions for users"""

    def __init__(self):
        self.user_mentors: Dict[int, MentorBot] = {}

    def assign_mentor(self, user_id: int, animal: Optional[MentorAnimal] = None) -> MentorBot:
        """Assign a mentor to a user"""
        if animal is None:
            # Auto-assign based on user preferences or random
            animal = random.choice(list(MentorAnimal))

        mentor = MentorBot(animal)
        self.user_mentors[user_id] = mentor
        return mentor

    def get_user_mentor(self, user_id: int) -> Optional[MentorBot]:
        """Get the assigned mentor for a user"""
        return self.user_mentors.get(user_id)

    def change_mentor(self, user_id: int, new_animal: MentorAnimal) -> MentorBot:
        """Change the mentor animal for a user"""
        return self.assign_mentor(user_id, new_animal)

    def get_available_mentors(self) -> List[Dict]:
        """Get list of available mentor animals with descriptions"""
        mentors = []
        for animal in MentorAnimal:
            bot = MentorBot(animal)
            mentors.append({
                "animal": animal.value,
                "name": animal.value.title(),
                "personality": bot.get_personality_description(),
                "avatar_url": bot.get_avatar_url(),
                "expertise": bot.personality["expertise"]
            })
        return mentors

# Global mentor bot manager
mentor_manager = MentorBotManager()
