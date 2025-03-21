import React, { useRef } from "react";
import { View, Button } from "react-native";
import { AudioContext } from "react-native-audio-api";

class InnerAudioContext {
  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.source = null;
    this.buffer = null;

    this._src = "";
    this._startTime = 0;
    this.autoplay = false;
    this.loop = false;
    this._volume = 1;
    this._playbackRate = 1;

    this._duration = 0;
    this._currentTime = 0;
    this._buffered = 0;

    this.isPlaying = false;

    this.gainNode.connect(this.audioContext.destination);
  }

  set volume(value) {
    if (value < 0 || value > 1) {
      throw new RangeError("Volume must be between 0 and 1");
    }
    this._volume = value;
    this.gainNode.gain.value = value; // 设置增益节点的音量
  }

  set playbackRate(value) {
    if (value < 0.5 || value > 2.0) {
      throw new RangeError("Playback rate must be between 0.5 and 2.0");
    }
    this._playbackRate = value;
  }

  set autoPlay(status) {
    this.autoPlay = status;
  }
  set src(url) {
    this._src = url;
    this.loadAudio(url).then(() => {
      if (this.autoPlay) {
        this.play();
      }
    });
  }

  set currentTime(value) {
    if (this.source && this.isPlaying) {
      this._currentTime = Math.max(0, Math.min(value, this._duration)); // 确保在有效范围内
      this.stop(); // 停止当前播放
      this.play(); // 从新的时间位置开始播放
    } else {
      this._currentTime = Math.max(0, Math.min(value, this._duration)); // 仅更新当前时间
    }
  }

  set startTime(time) {
    this._startTime = time;
    this._currentTime = time;
  }

  get src() {
    return this._src; // 返回音频时长
  }

  get volume() {
    return this._volume;
  }
  get duration() {
    return this._duration; // 返回音频时长
  }

  get currentTime() {
    return this._currentTime; // 返回当前播放位置
  }

  get startTime() {
    return this._startTime; // 返回当前播放位置
  }

  get buffered() {
    return this._buffered; // 返回缓冲的时间点
  }

  get playbackRate() {
    return this._playbackRate; // 返回缓冲的时间点
  }
  async loadAudio(url) {
    const response = await fetch(url);
    const audioData = await response.arrayBuffer();
    this.buffer = await this.audioContext.decodeAudioData(audioData);
    this._duration = this.buffer.duration; // 设置音频时长
  }

  updateCurrentTime() {
    if (this.isPlaying) {
      this._currentTime = this.audioContext.currentTime;
      setTimeout(() => this.updateCurrentTime(), 100); // 每100毫秒更新一次
    }
  }

  play() {
    if (this.buffer && !this.isPlaying) {
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.connect(this.gainNode);
      this.source.start(this._currentTime);
      this.source.loop = this.loop;
      this.isPlaying = true;
      this.source.loop = this.loop;
      this.source.playbackRate.value = this._playbackRate;
      this.updateCurrentTime();
      this.source.onended = () => {
        this.isPlaying = false;
      };
    }
  }

  pause() {
    if (this.isPlaying) {
      this.audioContext.suspend();
      this.isPlaying = false;
    }
  }
  seek(position) {
    if (position < 0 || position > this.duration) {
      throw new RangeError("Position must be between 0 and duration");
    }
    this._currentTime = position;
    if (this.isPlaying) {
      this.stop(); // 停止当前播放
      this.play(); // 重新播放
    }
  }

  stop() {
    if (this.source) {
      this.source.stop();
      this.source = null;
      this.isPlaying = false;
      this._currentTime = 0; // 重置当前时间
      this._duration = 0;
    }
  }

  destroy() {
    this.stop();
    this.audioContext.close();
  }
}

const AudioPlayer = () => {
  const audioPlayerRef = useRef(new InnerAudioContext());

  return (
    <View style={{ marginTop: 100 }}>
      <Button
        title="Load and Play"
        onPress={() => {
          audioPlayerRef.current.src =
            "http://music.163.com/song/media/outer/url?id=447925558.mp3"; // 替换为您的音频URL
          audioPlayerRef.current.play();
        }}
      />
      <Button title="Pause" onPress={() => audioPlayerRef.current.pause()} />
      <Button title="Stop" onPress={() => audioPlayerRef.current.stop()} />
      <Button
        title="Destroy"
        onPress={() => audioPlayerRef.current.destroy()}
      />
    </View>
  );
};

export default AudioPlayer;
