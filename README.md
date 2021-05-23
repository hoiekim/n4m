# n4m

I'm discovering what we can do with `Node.js` + `Max` + `Ableton Live`. If you have no idea what they are, please refer following documentations.

* [Node for Max](https://docs.cycling74.com/nodeformax/api/)
* [Max for Live](https://docs.cycling74.com/max5/vignettes/intro/doclive.html)
* [Ableton Live](https://www.ableton.com/en/manual/welcome-to-live/)

# What file does what:

### Max effectors

* `project01.amxd`

  Ableton Max midi effector that detects key inputs, analyzes chords and send them to respectively base, triad and tension.

* `project01_receiver_base.amxd`

  Ableton Max midi effector that receives base note sent from `project01.amxd`.

* `project01_receiver_triad.amxd`

  Ableton Max midi effector that receives triad notes sent from `project01.amxd`.

* `project01_receiver_tension.amxd`

  Ableton Max midi effector that receives tension notes sent from `project01.amxd`.

* `project01_receiver_triad_tension.amxd`

  Ableton Max midi effector that receives triad and tension notes sent from `project01.amxd`.


### Javascript

* `index.js`

  Main code that powers `project01.amxd`.

* `lib/chords.js`

  Helper functions that are used in `index.js`
