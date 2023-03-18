# ao3-api
An unofficial JavaScript API for Archive of Our Own (AO3). Based on the [Python version](https://github.com/ArmindoFlores/ao3_api) by Armindo Flores.
The goal was to emulate the Python version as closely as possible, but with the added benefit of being able to use it natively in Node.js (for my Discord bot).
None of the code has been rigorously tested, so don't expect it to work perfectly. If you find any bugs, please open an issue and I'll do my best to fix it.

The library is kind of barebones and only includes the things I need (works, chapters, users, sessions, and searches).
I will probably be adding other features slowly but don't expect anything too soon.

## Installation
```bash
npm install ao3-api
```

## Usage
```js
const AO3 = require('ao3-api');
```
There is no base AO3 constructor. You must call a static class under AO3, for example, AO3.Work() or AO3.Search().
```js
const AO3 = require('ao3-api');

// Get a work by ID
const work = new AO3.Work(12345678);
work.reload().then(() => {
    console.log(work.title);
});
```

## Testing
There are a bunch of files in the `test` directory. They're all named after the function they're testing. 
If you want, you can create a .env file in that directory and `AO3_USER=<your username>` and `AO3_PASS=<your password>` 
so you have access to restricted works. If you don't, you'll only be able to access public works.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

## "no typescript? \*megamind staring through peephole* i waaaannt typescript! 🤓"
Did I ask? No autocomplete for you! No type-checking for you! No IntelliSense for you! No nothing! You're on your own, buddy! Screw you!