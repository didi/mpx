<template>
  <div>
    <div class="carousel">
      <ul class="slides">
        <input type="radio" name="radio-buttons" id="img-1" checked />
        <li class="slide-container">
          <div class="slide-image">
            <img
              src="https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png"
            />
          </div>
          <div class="carousel-controls">
            <label for="img-3" class="prev-slide">
              <img src="../../public/doc-svg/anli_icon_left.svg" />
            </label>
            <label for="img-2" class="next-slide">
              <img src="../../public/doc-svg/anli_icon_right.svg" />
            </label>
          </div>
        </li>
        <input type="radio" name="radio-buttons" id="img-2" />
        <li class="slide-container">
          <div class="slide-image">
            <img
              src="https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png"
            />
          </div>
          <div class="carousel-controls">
            <label for="img-1" class="prev-slide">
              <img src="../../public/doc-svg/anli_icon_left.svg" />
            </label>
            <label for="img-3" class="next-slide">
              <img src="../../public/doc-svg/anli_icon_right.svg" />
            </label>
          </div>
        </li>
        <input type="radio" name="radio-buttons" id="img-3" />
        <li class="slide-container">
          <div class="slide-image">
            <img
              src="https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png"
            />
          </div>
          <div class="carousel-controls">
            <label for="img-2" class="prev-slide">
              <img src="../../public/doc-svg/anli_icon_left.svg" />
            </label>
            <label for="img-1" class="next-slide">
              <img src="../../public/doc-svg/anli_icon_right.svg" />
            </label>
          </div>
        </li>
        <div class="carousel-dots">
          <label for="img-1" class="carousel-dot" id="img-dot-1">
              <img
              src="https://dpubstatic.udache.com/static/dpubimg/bcca3d10-01b7-4c08-951a-22418b2443d6.jpg"
            />
          </label>
          <label for="img-2" class="carousel-dot" id="img-dot-2">
              <img
              src="https://dpubstatic.udache.com/static/dpubimg/8c25bec8-938e-452d-96f9-5e524092a8ee.png"
            />
          </label>
          <label for="img-3" class="carousel-dot" id="img-dot-3">
              <img
              src="https://dpubstatic.udache.com/static/dpubimg/d3b62a33-7dbd-45ea-a4aa-f30ad61965f2.jpg"
            />
          </label>
        </div>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  //   name: 'slider',
  //   props: {
  //     initialSpeed: {
  //       type: Number,
  //       default: 30
  //     },
  //     initialInterval: {
  //       type: Number,
  //       default: 4
  //     }
  //   },
  //   data () {
  //     return {
  //       sliders:[
  //         {
  //           img:'https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png'
  //         },
  //         {
  //           img:'https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png'
  //         },
  //         {
  //           img:'https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png'
  //         },
  //         {
  //           img:'https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png'
  //         },
  //         {
  //           img:'https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png'
  //         }
  //       ],
  //       currentIndex:1,
  //       distance:-600,
  //       transitionEnd: true,
  //       speed: this.initialSpeed
  //     }
  //   },
  //   computed:{
  //     containerStyle() {
  //       return {
  //         transform:`translate3d(${this.distance}px, 0, 0)`
  //       }
  //     },
  //     interval() {
  //       return this.initialInterval * 1000
  //     }
  //   },
  //   mounted() {
  //     this.init()
  //   },
  //   methods:{
  //     init() {
  //       this.play()
  //       window.onblur = function() { this.stop() }.bind(this)
  //       window.onfocus = function() { this.play() }.bind(this)
  //     },
  //     move(offset, direction, speed) {
  //       if (!this.transitionEnd) return
  //       this.transitionEnd = false
  //       direction === -1 ? this.currentIndex += offset/600 : this.currentIndex -= offset/600
  //       if (this.currentIndex > 5) this.currentIndex = 1
  //       if (this.currentIndex < 1) this.currentIndex = 5
  //       const destination = this.distance + offset * direction
  //       this.animate(destination, direction, speed)
  //     },
  //     animate(des, direc, speed) {
  //       if (this.temp) {
  //         window.clearInterval(this.temp)
  //         this.temp = null
  //       }
  //       this.temp = window.setInterval(() => {
  //         if ((direc === -1 && des < this.distance) || (direc === 1 && des > this.distance)) {
  //           this.distance += speed * direc
  //         } else {
  //           this.transitionEnd = true
  //           window.clearInterval(this.temp)
  //           this.distance = des
  //           if (des < -3000) this.distance = -600
  //           if (des > -600) this.distance = -3000
  //         }
  //       }, 20)
  //     },
  //     jump(index) {
  //       const direction = index - this.currentIndex >= 0 ? -1 : 1
  //       const offset = Math.abs(index - this.currentIndex) * 600
  //       const jumpSpeed = Math.abs(index - this.currentIndex) === 0 ? this.speed : Math.abs(index - this.currentIndex) * this.speed
  //       this.move(offset, direction, jumpSpeed)
  //     },
  //     play() {
  //       if (this.timer) {
  //         window.clearInterval(this.timer)
  //         this.timer = null
  //       }
  //       this.timer = window.setInterval(() => {
  //         this.move(600, -1, this.speed)
  //       }, this.interval)
  //     },
  //     stop() {
  //       window.clearInterval(this.timer)
  //       this.timer = null
  //     }
  //   }
};
</script>

<style scoped>
.carousel {

  /* margin-left: 15%;
  margin-right: 15%; */
}

ul.slides {
  /* display: block; */
  display: flex;
  position: relative;
  height: 750px;
  width: 100%;
  margin: 40px 0 0 0 ;
  padding: 0;
  overflow: hidden;
  list-style: none;
}

.slides * {
  user-select: none;
  -ms-user-select: none;
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

ul.slides input {
  display: none;
}

.slide-container {
  display: block;

  background: url('https://dpubstatic.udache.com/static/dpubimg/XrJHfoN2ky/anli_bg.png') no-repeat center center;
}

.slide-image {
  display: block;
  position: absolute;
  /* width: 100%; 
  height: 100%; */
  width: 402px;
  height: 402px;
  top: 0;
  left: 50%;
  margin-left: -201px;
  opacity: 0;
  transition: all 0.7s ease-in-out;
}

.slide-image img {
  width: auto;
  /* min-width: 100%; */
  height: 100%;

  width: 213px;
}

.carousel-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  font-size: 100px;
  /* line-height: 600px; */
  color: #fff;
}

.carousel-controls label {
  display: none;
  position: absolute;
  padding: 0 20px;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.carousel-controls label {
  opacity: 1;
}

/* .carousel-controls label:hover {
  opacity: 1;
} */

span {
    background-color: aqua;
}
.carousel-controls .prev-slide {
  width: 100px;
  text-align: left;
  left: 0;

  position: absolute;
  top: 480px;
}

.carousel-controls .next-slide {
  width: 100px;
  text-align: right;
  right: 0;

  position: absolute;
  top: 480px;
}

.carousel-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 125px;
  /* z-index: 999; */
  text-align: center;
}

.carousel-dots .carousel-dot {
  /* display: inline-block; */
  width: 40px;
  height: 40px;
  border-radius: 10px;
  opacity: 0.3;
  margin: 30px;
  box-shadow: 0 33px 96px 0 rgba(49,188,127,0.07), 0 7px 21px 0 rgba(49,188,127,0.04), 0 2px 6px 0 rgba(49,188,127,0.03);
  cursor: pointer;
}

input:checked + .slide-container .slide-image {
  opacity: 1;
  transform: scale(1);
  transition: opacity 1s ease-in-out;
}

input:checked + .slide-container .carousel-controls label {
  display: block;
}

input#img-1:checked ~ .carousel-dots label#img-dot-1,
input#img-2:checked ~ .carousel-dots label#img-dot-2,
input#img-3:checked ~ .carousel-dots label#img-dot-3,
input#img-4:checked ~ .carousel-dots label#img-dot-4,
input#img-5:checked ~ .carousel-dots label#img-dot-5,
input#img-6:checked ~ .carousel-dots label#img-dot-6 {
  opacity: 1;
  width: 143px;
  height: 145px;
}

input:checked + .slide-container .nav label {
  display: block;
}
</style>