import { bindable } from 'aurelia';

type TrendState = 'positive' | 'negative' | 'neutral';

export class StatCard {
  @bindable() title = 'Active users';
  @bindable() value: number | string = 0;
  @bindable() unit = '';
  @bindable() change = 0; // percent delta
  @bindable() description = '';
  @bindable() changeCopy = 'vs last week';
  @bindable() onRefresh?: () => void;

  refresh() {
    this.onRefresh?.();
  }

  get changeLabel() {
    const numeric = typeof this.change === 'number' ? this.change : Number(this.change);
    if (!Number.isFinite(numeric)) {
      return '0%';
    }
    const rounded = numeric.toFixed(1).replace(/\.0$/, '');
    const sign = numeric > 0 ? '+' : '';
    return `${sign}${rounded}%`;
  }

  get changeState(): TrendState {
    const numeric = typeof this.change === 'number' ? this.change : Number(this.change);
    if (!Number.isFinite(numeric)) {
      return 'neutral';
    }
    if (numeric > 0) {
      return 'positive';
    }
    if (numeric < 0) {
      return 'negative';
    }
    return 'neutral';
  }
}
