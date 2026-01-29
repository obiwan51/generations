/**
 * WeatherSystem - Handles weather particle effects and seasonal overlays
 */
export class WeatherSystem {
    particles = [];
    canvas;
    ctx;
    weatherEnabled = true;
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.initParticles();
        window.addEventListener('resize', () => this.initParticles());
    }
    setWeatherEnabled(enabled) {
        this.weatherEnabled = enabled;
    }
    initParticles() {
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: 2 + Math.random() * 3,
                size: 1 + Math.random() * 2
            });
        }
    }
    /**
     * Apply color overlay based on season
     */
    applySeasonEffects(season) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        if (season === 'summer') {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        else if (season === 'autumn') {
            this.ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        else if (season === 'winter') {
            this.ctx.fillStyle = 'rgba(200, 200, 255, 0.15)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Simple snow effect overlay
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = 'white';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }
    /**
     * Draw animated weather particles (rain/snow)
     */
    drawWeather(season) {
        if (!this.weatherEnabled)
            return;
        if (season !== 'winter' && season !== 'autumn')
            return;
        this.ctx.save();
        if (season === 'winter') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        }
        else if (season === 'autumn') {
            this.ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
        }
        this.particles.forEach(p => {
            if (season === 'winter') {
                // Snow falls down-right with sine wave
                p.y += p.speed * 0.5;
                p.x += Math.sin(Date.now() / 1000 + p.x) * 0.5;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            else if (season === 'autumn') {
                // Rain falls fast
                p.y += p.speed * 2;
                p.x += 1;
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x + 2, p.y + 10);
                this.ctx.stroke();
            }
            // Wrap particles
            if (p.y > this.canvas.height)
                p.y = -10;
            if (p.x > this.canvas.width)
                p.x = -10;
        });
        this.ctx.restore();
    }
}
//# sourceMappingURL=WeatherSystem.js.map