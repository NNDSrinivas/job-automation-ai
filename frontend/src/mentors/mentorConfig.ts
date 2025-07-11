export interface MentorConfig {
  id: string;
  name: string;
  animationPath: string;
  messages: string[];
  screen: string;
}

export const mentorConfigMap: Record<string, MentorConfig[]> = {
  '/': [
    {
      id: 'homeOwl',
      name: 'Ollie the Owl',
      animationPath: 'Owl-blink.json',
      messages: [
        "Welcome back, champion!",
        "Let’s soar through your job journey!",
        "Whoo’s ready for success today?"
      ],
      screen: '/',
    },
    {
      id: 'homeTiger',
      name: 'Tara the Tiger',
      animationPath: 'Meditating Tiger.json',
      messages: [
        "Fierce and focused – that’s how we job hunt!",
        "Let’s pounce on opportunities!",
        "Your dream job doesn’t stand a chance!"
      ],
      screen: '/',
    },
  ],
  '/signup': [
    {
      id: 'signupDog',
      name: 'Benny the Beagle',
      animationPath: 'Dog walking.json',
      messages: [
        "Excited to have you join us!",
        "Your journey starts here!",
        "Ready to fetch that dream job?"
      ],
      screen: '/signup',
    },
    {
      id: 'signupPig',
      name: 'Pip the Pig',
      animationPath: 'king pig.json',
      messages: [
        "Oink! Let’s roll into your new career!",
        "Time to make your profile shine!",
        "Don’t be shy—apply apply apply!"
      ],
      screen: '/signup',
    },
  ],
  '/match': [
    {
      id: 'matchPenguin',
      name: 'Penny the Penguin',
      animationPath: '3D Baby Penguin Character Dance.json',
      messages: [
        "I’m dancing because your resume rocks!",
        "Matching magic is happening!",
        "Let’s waddle through job listings together!"
      ],
      screen: '/match',
    },
    {
      id: 'matchMonkey',
      name: 'Milo the Monkey',
      animationPath: 'monkey-jump.json',
      messages: [
        "Swinging through job matches!",
        "Bananas for your skills!",
        "Let’s monkey around with some jobs!"
      ],
      screen: '/match',
    },
  ],
  '/cover': [
    {
      id: 'letterFox',
      name: 'Fiona the Fox',
      animationPath: 'fox-wink.json',
      messages: [
        "Clever cover letters win hearts!",
        "Let’s make it smart and snappy!",
        "Your story deserves the spotlight!"
      ],
      screen: '/cover',
    },
    {
      id: 'letterDeer',
      name: 'Daisy the Deer',
      animationPath: 'deer-look.json',
      messages: [
        "Stay graceful under pressure.",
        "Let’s craft something elegant.",
        "Make recruiters stop in their tracks!"
      ],
      screen: '/cover',
    },
  ],
  '/profile': [
    {
      id: 'profileBear',
      name: 'Barry the Bear',
      animationPath: 'Bear Success.json',
      messages: [
        "Strong profile, strong presence!",
        "Let’s update your experience.",
        "Growl-worthy resume incoming!"
      ],
      screen: '/profile',
    },
    {
      id: 'profileElephant',
      name: 'Ella the Elephant',
      animationPath: 'Loading Elephant.json',
      messages: [
        "Big dreams, big profiles!",
        "Let’s stomp through those updates!",
        "Never forget to add your wins!"
      ],
      screen: '/profile',
    },
  ],
  '*': [
    {
      id: 'fallbackCat',
      name: 'Milo the Cat',
      animationPath: '404 error cat.json',
      messages: [
        "Hmm... this page seems lost 🐾",
        "I’ll guide you back to safety!",
      ],
      screen: '*',
    },
    {
      id: 'fallbackLion',
      name: 'Leo the Lion',
      animationPath: 'lion-roar.json',
      messages: [
        "Wrong page, but you're still a king!",
        "Roaring our way back home!",
      ],
      screen: '*',
    },
  ],
};
