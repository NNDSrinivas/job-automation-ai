// src/components/AnimatedMentors.tsx

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import penguinAnim from '../assets/animations/penguin-dance.json';
import bearAnim from '../assets/animations/Bear Success.json';
import foxAnim from '../assets/animations/fox-wink.json';
import owlAnim from '../assets/animations/Owl-blink.json';
import './MentorStyles.css';

const mentors = [
	{
		name: 'Penguin',
		animation: penguinAnim,
		emotions: ['funny', 'supportive', 'surprised'],
		messages: [
			{ text: 'Hey there, champ! 💪', emotion: 'supportive' },
			{ text: "Uploading a resume? I've done that 104 times today!", emotion: 'funny' },
			{ text: 'Wanna see a magic trick? Just click something!', emotion: 'funny' },
			{ text: "Need help? Just shout 'Penguin!' 🐧", emotion: 'supportive' },
			{ text: 'Whoa! Did you see that job match?', emotion: 'surprised' },
		],
	},
	{
		name: 'Bear',
		animation: bearAnim,
		emotions: ['supportive', 'angry', 'funny'],
		messages: [
			{ text: 'Bear hugs for good luck! 🐻', emotion: 'supportive' },
			{ text: 'Grrr... That job was tough!', emotion: 'angry' },
			{ text: 'I once applied to 50 jobs in a day!', emotion: 'funny' },
		],
	},
	{
		name: 'Fox',
		animation: foxAnim,
		emotions: ['funny', 'surprised', 'supportive'],
		messages: [
			{ text: 'Stay clever, friend! 🦊', emotion: 'supportive' },
			{ text: 'Did you just outsmart the system?', emotion: 'surprised' },
			{ text: 'I wink at every recruiter!', emotion: 'funny' },
		],
	},
	{
		name: 'Owl',
		animation: owlAnim,
		emotions: ['supportive', 'funny', 'angry'],
		messages: [
			{ text: 'Wise choice! 🦉', emotion: 'supportive' },
			{ text: "Whooo's ready for interviews?", emotion: 'funny' },
			{ text: "Don't make me angry, I'll hoot!", emotion: 'angry' },
		],
	},
];

function getRandomMentor() {
	return mentors[Math.floor(Math.random() * mentors.length)];
}

const AnimatedMentors = () => {
	const [mentor, setMentor] = useState(getRandomMentor());
	const [currentMessage, setCurrentMessage] = useState(mentor.messages[0]);
	const [position, setPosition] = useState(0); // For movement

	useEffect(() => {
		const messageInterval = setInterval(() => {
			const msg = mentor.messages[Math.floor(Math.random() * mentor.messages.length)];
			setCurrentMessage(msg);
		}, 7000);
		const mentorInterval = setInterval(() => {
			setMentor(getRandomMentor());
			setPosition(Math.floor(Math.random() * 80)); // Move to random position
		}, 21000);
		return () => {
			clearInterval(messageInterval);
			clearInterval(mentorInterval);
		};
	}, [mentor]);

	// Dynamic style for movement
	const mentorStyle = {
		left: `${position}%`,
		transition: 'left 1.5s cubic-bezier(.68,-0.55,.27,1.55)',
		position: 'absolute' as const,
		maxWidth: '220px',
	};

	// Emotion-based animation class
	const emotionClass = `mentor-message mentor-${currentMessage.emotion}`;

	return (
		<div className="mentor-container" style={mentorStyle}>
			<Lottie animationData={mentor.animation} className="mentor-lottie" loop />
			<p className={emotionClass}>
				{mentor.name}: {currentMessage.text}
			</p>
		</div>
	);
};

export default AnimatedMentors;
