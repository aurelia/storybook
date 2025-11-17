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
    const rounded = Number(this.change).toFixed(1).replace(/\.0$/, '');
    const sign = this.change > 0 ? '+' : '';
    return `${sign}${rounded}%`;
  }

  get changeState(): TrendState {
    if (this.change > 0) {
      return 'positive';
    }
    if (this.change < 0) {
      return 'negative';
    }
    return 'neutral';
  }
}
