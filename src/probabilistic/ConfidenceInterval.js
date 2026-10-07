export class ConfidenceInterval {
  constructor(lower = 0.0, upper = 1.0, level = 0.95, pointEstimate = 0.5) {
    this.lower = lower;
    this.upper = upper;
    this.level = level;
    this.pointEstimate = pointEstimate;
    this.width = Math.max(0.0, upper - lower);
    Object.freeze(this);
  }

  contains(val) {
    return val >= this.lower && val <= this.upper;
  }

  toJSON() {
    return {
      lower: this.lower,
      upper: this.upper,
      level: this.level,
      pointEstimate: this.pointEstimate,
      width: this.width
    };
  }
}
