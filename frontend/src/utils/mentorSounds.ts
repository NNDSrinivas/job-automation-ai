import owl from '../assets/sounds/owl.mp3';
import tiger from '../assets/sounds/tiger.mp3';
import beagle from '../assets/sounds/beagle.mp3';
import pig from '../assets/sounds/pig.mp3';
import penguin from '../assets/sounds/penguin.mp3';
import monkey from '../assets/sounds/monkey.mp3';
import fox from '../assets/sounds/fox.mp3';
import deer from '../assets/sounds/deer.mp3';
import bear from '../assets/sounds/bear.mp3';
import elephant from '../assets/sounds/elephant.mp3';
import cat from '../assets/sounds/cat.mp3';
import lion from '../assets/sounds/lion.mp3';

const sounds: Record<string, string> = {
  homeOwl: owl,
  homeTiger: tiger,
  signupDog: beagle,
  signupPig: pig,
  matchPenguin: penguin,
  matchMonkey: monkey,
  letterFox: fox,
  letterDeer: deer,
  profileBear: bear,
  profileElephant: elephant,
  fallbackCat: cat,
  fallbackLion: lion,
};

export default sounds;
