# n4m

I'm discovering what we can do with `Node.js` + `Max` + `Ableton Live`. If you have no idea what they are, please refer following documentations.

* [Node for Max](https://docs.cycling74.com/nodeformax/api/)
* [Max for Live](https://docs.cycling74.com/max5/vignettes/intro/doclive.html)
* [Ableton Live](https://www.ableton.com/en/manual/welcome-to-live/)

# What file does what:

### Max effectors

`receiver` and `stepper` requires `anaylzer` to be running. They can be used in separated tracks though.

* `analyzer.amxd`

  Ableton Max midi effector that detects key inputs, analyzes chords and send them to respectively bass, triad and tension.

* `receiver.amxd`

  Ableton Max midi effector that receives analyzed notes sent from `analyzer`.

* `stepper.amxd`

  Ableton Max midi effector that receives bass note sent from `analyzer` and plays according to user-designed grid.

### Javascript

* `analyzer.js`

  Main code that powers `anaylzer.amxd`.

* `stepper.js`

  Main code that powers `stepper.amxd`.

* `lib/chords.js`

  Helper functions that are used in `index.js`
