/**
 * 🚀 Boot Performance Monitor
 * Tracks initialization phases and timing metrics
 */

interface BootPhase {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class BootMonitor {
  private static instance: BootMonitor;
  private phases: BootPhase[] = [];
  private startTime: number = Date.now();

  static getInstance(): BootMonitor {
    if (!BootMonitor.instance) {
      BootMonitor.instance = new BootMonitor();
    }
    return BootMonitor.instance;
  }

  startPhase(name: string): void {
    const phase: BootPhase = {
      name,
      startTime: Date.now(),
    };
    this.phases.push(phase);
    console.log(`🚀 Boot Phase Started: ${name}`);
  }

  endPhase(name: string): void {
    const phase = this.phases.find(p => p.name === name && !p.endTime);
    if (phase) {
      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
      console.log(`✅ Boot Phase Completed: ${name} (${phase.duration}ms)`);
    }
  }

  getTotalBootTime(): number {
    return Date.now() - this.startTime;
  }

  getPhaseReport(): string {
    const totalTime = this.getTotalBootTime();
    let report = `\n🚀 Boot Performance Report (Total: ${totalTime}ms)\n`;
    report += '=' .repeat(50) + '\n';
    
    this.phases.forEach(phase => {
      const duration = phase.duration || (Date.now() - phase.startTime);
      const percentage = ((duration / totalTime) * 100).toFixed(1);
      report += `${phase.name}: ${duration}ms (${percentage}%)\n`;
    });
    
    return report;
  }

  logReport(): void {
    console.log(this.getPhaseReport());
  }

  reset(): void {
    this.phases = [];
    this.startTime = Date.now();
  }
}

export const bootMonitor = BootMonitor.getInstance();

