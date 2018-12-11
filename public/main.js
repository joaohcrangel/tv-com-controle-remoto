firebase.initializeApp({
    apiKey: "AIzaSyDhYCC15MLfE2cu34bctCRViCJmye7Q3QI",
    authDomain: "tv-controle-31b40.firebaseapp.com",
    databaseURL: "https://tv-controle-31b40.firebaseio.com",
    projectId: "tv-controle-31b40",
    storageBucket: "tv-controle-31b40.appspot.com",
    messagingSenderId: "880505248177"
});

var channels = [];
const db = firebase.firestore();

db.settings({
    timestampsInSnapshots: true
});

class TV {

    constructor() {

        this.video = document.querySelector("#video");
        this.channelDisplay = document.querySelector("#canal-number");
        this.volumeDisplay = document.querySelector("#volume");

        db.collection('channels').onSnapshot(snap => {

            let _channels = [];

            snap.forEach(doc => {
                _channels.push(doc.data());
            });          

            channels = _channels;

            if (this.video) this.listenerCanal();

        });

    }

    ligar() {

        this.ligado = true;
        this.play();

    }

    desligar() {

        this.ligado = false;
        this.video.stop();

    }

    play() {

        if (this.ligado) {

            var playPromise = this.video.play();

            if (playPromise !== undefined) {
                playPromise.then(_ => {

                    

                })
                    .catch(error => {
                        
                    });
            }

        }

    }

    getChannel(number){

        let _channels = channels.filter(c => c.number == number);
        return (_channels.length) ? _channels[0] : {
            src: 'https://firebasestorage.googleapis.com/v0/b/tv-controle-31b40.appspot.com/o/no.mp4?alt=media&token=2e9efeeb-4a32-487d-930f-520e8cf405b3'
        };

    }

    listenerCanal() {

        db.collection("tv").doc('YkEOAp2oAHVUtZmrSQlf').onSnapshot((doc) => {

            let data = doc.data();
            let channel = this.getChannel(data.number);

            let currentURL = (this.video.src) ? new URL(this.video.src) : new URL('http://localhost:8080');
            let newURL = new URL(channel.src);
            //let newURL = new URL(location.origin + location.pathname.replace('index.html', '') + "assets/videos/" + channel.src);

            let changeStatus = (this.ligado !== data.status);
            let changeVolume = (this.video.volume !== data.volume);

            let changeChannel = (currentURL.pathname !== newURL.pathname);

            this.ligado = data.status;
           
            if (changeChannel) {

                this.video.src = channel.src + '#t=' + (parseInt(Date.now() / 1000) - channel.startAt) % channel.duration;
                if (this.ligado) {
                    this.channelDisplay.innerHTML = data.number;
                    this.channelDisplay.style.display = 'block';
                    clearTimeout(this.timerChannel);
                    this.timerChannel = setTimeout(() => {
                        this.channelDisplay.style.display = 'none';
                    }, 3000);
                }

            }

            if (changeVolume) {

                this.video.volume = data.volume;
                if (this.ligado) {
                    this.volumeDisplay.querySelector('.bar').style.width = parseInt(data.volume * 100) + '%';
                    this.volumeDisplay.style.display = 'block';
                    clearTimeout(this.timerVolume);
                    this.timerVolume = setTimeout(() => {
                        this.volumeDisplay.style.display = 'none';
                    }, 3000);
                }

            }

            if (changeStatus) {
                if (this.ligado) {
                    this.play();
                } else {
                    this.video.src = '#';
                }
            } else if (this.video.paused && this.ligado) {
                this.play();
            }

        });

    }

}

class Controle {

    constructor() {

        this.tv = db.collection("tv").doc('YkEOAp2oAHVUtZmrSQlf');

        this.btnChannels = document.querySelectorAll("[data-channel]");
        this.btnOn = document.querySelector("#btn-on");
        this.btnVolumeUp = document.querySelector("#btn-volume-up");
        this.btnVolumeDown = document.querySelector("#btn-volume-down");

        if (this.btnOn && this.btnVolumeUp && this.btnVolumeDown) this.initBotoes();

    }

    initBotoes() {

        [...this.btnChannels].forEach(btn => {

            btn.addEventListener('click', e => {

                this.setData({
                    number: e.target.dataset.channel
                });

            });

        });

        this.btnOn.addEventListener('click', () => {

            this.tv.get().then(doc => {

                this.setData({
                    status: !doc.data().status
                });

            });

        });

        this.btnVolumeUp.addEventListener('click', () => {

            this.tv.get().then(doc => {

                this.setData({
                    volume: this.volumeUp(doc.data().volume)
                });

            });

        });

        this.btnVolumeDown.addEventListener('click', () => {

            this.tv.get().then(doc => {

                this.setData({
                    volume: this.volumeDown(doc.data().volume)
                });

            });

        });

    }

    volumeUp(volume) {

        if (!volume) volume = .5;

        volume += 0.1;

        if (volume > 1) volume = 1;

        return parseFloat(parseFloat(volume).toFixed(1));

    }

    volumeDown(volume) {

        if (!volume) volume = .5;

        volume -= 0.1;

        if (volume < 0) volume = 0;

        return parseFloat(parseFloat(volume).toFixed(1));

    }

    setData(canal) {

        return this.tv.set(canal, {
            merge: true
        });

    }

}

let tv = new TV();
let controle = new Controle();