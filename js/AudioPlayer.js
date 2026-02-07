class AudioPlayer {
  constructor() {
    this.status = 'stopped';
    this.preloadedSounds = new Map();
    this.urlToIndex = new Map();
    this.originalURLs = [];
    this.currentAudio = null;
    this.currentUrl = null;
    this.currentIndex = null;
    this.listeners = new Set();
    this.loopCurrent = false;
    this.loopPlaylist = false;
    this.isPlayingPlaylist = false;
    this.playlistIndex = 0;
    
    // Volume property
    this.volume = 1.0; // Default volume (0.0 to 1.0)
  }

  onStatusChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emitStatusChange(status, url, index) {
    this.listeners.forEach(callback => callback(status, url, index));
  }

  async preload(urls) {
    this.originalURLs = urls;
    this.preloadedSounds.clear();
    this.urlToIndex.clear();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const audio = new Audio();
      audio.volume = this.volume; // Set initial volume
      
      await new Promise((resolve) => {
        audio.addEventListener('canplaythrough', () => {
          this.preloadedSounds.set(url, audio);
          this.urlToIndex.set(url, i);
          const filename = url.split('/').pop();
          this.urlToIndex.set(filename, i);
          resolve();
        }, { once: true });
        
        audio.src = url;
        audio.preload = 'auto';
      });
    }
  }

  setVolume(volume) {
    // Ensure volume is between 0 and 1
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all preloaded sounds
    this.preloadedSounds.forEach(audio => {
      audio.volume = this.volume;
    });
    
    // Update volume for currently playing audio if it exists
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  async play(input, loop = false) {
    // Stop current playback if any
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Play all audios in sequence (playlist mode)
    if (input === undefined || input === null) {
      if (this.originalURLs.length === 0) {
        throw new Error('No sounds preloaded');
      }
      
      this.isPlayingPlaylist = true;
      this.loopPlaylist = loop;
      this.playlistIndex = 0;
      await this.playTrack(this.originalURLs[0], false);
      return;
    }

    // Play single audio
    this.isPlayingPlaylist = false;
    this.loopCurrent = loop;
    
    let url;
    if (this.preloadedSounds.has(input)) {
      url = input;
    } else {
      // Try to find by filename
      for (const [loadedUrl] of this.preloadedSounds) {
        if (loadedUrl.includes(input) || loadedUrl.endsWith(input)) {
          url = loadedUrl;
          break;
        }
      }
    }

    if (!url || !this.preloadedSounds.has(url)) {
      throw new Error(`Sound "${input}" not found`);
    }

    await this.playTrack(url, loop);
  }

  async playTrack(url, loop) {
    this.currentAudio = this.preloadedSounds.get(url).cloneNode();
    this.currentAudio.volume = this.volume; // Set volume on clone
    this.currentUrl = url;
    this.currentIndex = this.urlToIndex.get(url);
    
    this.currentAudio.loop = loop; // Use native loop property
    
    if (this.isPlayingPlaylist) {
      this.currentAudio.addEventListener('ended', () => {
        this.playNextInPlaylist();
      });
    } else {
      this.currentAudio.addEventListener('ended', () => {
        this.status = 'stopped';
        this.emitStatusChange(this.status, undefined, undefined);
      });
    }

    await this.currentAudio.play();
    this.status = 'playing';
    this.emitStatusChange(this.status, this.currentUrl, this.currentIndex);
  }

  async playNextInPlaylist() {
    if (!this.isPlayingPlaylist) return;
    
    this.playlistIndex++;
    
    if (this.playlistIndex >= this.originalURLs.length) {
      if (this.loopPlaylist) {
        this.playlistIndex = 0;
      } else {
        this.stop();
        return;
      }
    }
    
    try {
      await this.playTrack(this.originalURLs[this.playlistIndex], false);
    } catch (error) {
      console.error('Failed to play next track:', error);
    }
  }

  pause() {
    if (this.status === 'playing' && this.currentAudio) {
      this.currentAudio.pause();
      this.status = 'paused';
      this.emitStatusChange(this.status, this.currentUrl, this.currentIndex);
    }
  }

  resume() {
    if (this.status === 'paused' && this.currentAudio) {
      this.currentAudio.play();
      this.status = 'playing';
      this.emitStatusChange(this.status, this.currentUrl, this.currentIndex);
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    this.status = 'stopped';
    this.isPlayingPlaylist = false;
    this.playlistIndex = 0;
    this.emitStatusChange(this.status, undefined, undefined);
    this.currentUrl = null;
    this.currentIndex = null;
  }
}