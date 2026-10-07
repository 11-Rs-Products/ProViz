export class ProbabilisticSession {
  constructor({
    id,
    campaignId,
    startTime = Date.now(),
    endTime = null,
    stepCount = 0,
    isPaused = false
  }) {
    this.id = id || `session:${Date.now()}`;
    this.campaignId = campaignId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.stepCount = stepCount;
    this.isPaused = isPaused;
  }

  step() {
    this.stepCount++;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  end() {
    this.endTime = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      campaignId: this.campaignId,
      startTime: this.startTime,
      endTime: this.endTime,
      stepCount: this.stepCount,
      isPaused: this.isPaused
    };
  }
}
