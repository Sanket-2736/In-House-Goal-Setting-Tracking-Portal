/**
 * Client-side logging utility
 * Logs to console in development, can be extended for production logging
 */

type LogLevel = "info" | "warn" | "error" | "debug" | "success";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (process.env.NODE_ENV === "development") {
      const style = this.getConsoleStyle(level);
      console.log(
        `%c[${level.toUpperCase()}] ${message}`,
        style,
        data ? data : ""
      );
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      info: "color: #3b82f6; font-weight: bold;",
      warn: "color: #f59e0b; font-weight: bold;",
      error: "color: #ef4444; font-weight: bold;",
      debug: "color: #8b5cf6; font-weight: bold;",
      success: "color: #10b981; font-weight: bold;",
    };
    return styles[level];
  }

  info(message: string, data?: any): void {
    this.addLog("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.addLog("warn", message, data);
  }

  error(message: string, data?: any): void {
    this.addLog("error", message, data);
  }

  debug(message: string, data?: any): void {
    this.addLog("debug", message, data);
  }

  success(message: string, data?: any): void {
    this.addLog("success", message, data);
  }

  apiCall(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    data?: any
  ): void {
    const message = `${method} ${endpoint} ${status} in ${duration}ms`;
    const level = status >= 400 ? "error" : status >= 300 ? "warn" : "success";
    this.addLog(level, message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
