/**
 * 🏰 肉鸽塔防 - 横版侧视 v0.2.0
 * 敌人从右向左进攻，防御塔放置在路径上
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 500,
    GROUND_Y: 400,
    TOWER_SIZE: 50,
    ENEMY_SIZE: 40,
    BULLET_RADIUS: 6,
    FPS: 60,
    LANES: 5,  // 5 条路径
    LANE_HEIGHT: 60
};

// ==================== 技能库 ====================
const SKILLS = [
    { id: 'damage', name: '攻击力 +', desc: '防御塔伤害 +20%', rarity: 'common' },
    { id: 'attackSpeed', name: '攻速 +', desc: '攻击速度 +25%', rarity: 'common' },
    { id: 'range', name: '射程 +', desc: '攻击范围 +30%', rarity: 'common' },
    { id: 'gold', name: '财富 +', desc: '金币获取 +30%', rarity: 'common' },
    { id: 'health', name: '生命 +', desc: '最大生命 +5', rarity: 'common' },
    { id: 'multishot', name: '多重射击', desc: '子弹数量 +1', rarity: 'rare' },
    { id: 'pierce', name: '穿透', desc: '子弹可穿透 2 个敌人', rarity: 'rare' },
    { id: 'slow', name: '冰冻', desc: '攻击有 30% 概率减速敌人', rarity: 'rare' },
    { id: 'crit', name: '暴击', desc: '20% 概率造成 200% 伤害', rarity: 'rare' },
    { id: 'chain', name: '连锁闪电', desc: '攻击有 25% 概率连锁 3 个敌人', rarity: 'epic' },
    { id: 'explosion', name: '爆炸', desc: '击杀敌人产生小范围爆炸', rarity: 'epic' },
    { id: 'snipe', name: '狙击', desc: '射程 +100% 伤害 +50%', rarity: 'epic' }
];

// ==================== 防御塔类 ====================
class Tower {
    constructor(x, y, lane) {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.width = CONFIG.TOWER_SIZE;
        this.height = CONFIG.TOWER_SIZE;
        this.range = 200;
        this.damage = 15;
        this.attackSpeed = 50;
        this.cooldown = 0;
        this.color = '#4CAF50';
        
        // 技能效果
        this.multishot = 0;
        this.pierce = 0;
        this.slowChance = 0;
        this.critChance = 0;
        this.critMultiplier = 1;
        this.chainChance = 0;
        this.explosion = false;
    }
    
    update(enemies, bullets) {
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }
        
        // 只攻击同一行的敌人
        const laneEnemies = enemies.filter(e => e.lane === this.lane && e.active);
        const target = this.findTarget(laneEnemies);
        if (target) {
            this.shoot(target, bullets);
            this.cooldown = this.attackSpeed;
        }
    }
    
    findTarget(enemies) {
        // 找最近的敌人
        let closest = null;
        let closestDist = Infinity;
        
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const distance = Math.abs(dx);
            if (distance < this.range && distance < closestDist) {
                closest = enemy;
                closestDist = distance;
            }
        }
        return closest;
    }
    
    shoot(target, bullets) {
        const direction = target.x > this.x ? 1 : -1;
        const speed = 10 * direction;
        
        // 多重射击
        const bulletCount = 1 + this.multishot;
        for (let i = 0; i < bulletCount; i++) {
            bullets.push(new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                speed,
                (Math.random() - 0.5) * 2,  // 轻微散射
                this.damage,
                this.pierce,
                this.slowChance,
                this.critChance,
                this.critMultiplier,
                this.chainChance,
                this.explosion,
                this.lane
            ));
        }
    }
    
    draw(ctx) {
        // 塔座
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - 5, this.y + this.height - 10, this.width + 10, 10);
        
        // 塔身
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 炮管
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x + this.width - 10, this.y + 15, 20, 10);
        
        // 装饰
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    applySkill(skillId) {
        switch(skillId) {
            case 'damage':
                this.damage *= 1.2;
                break;
            case 'attackSpeed':
                this.attackSpeed = Math.max(15, this.attackSpeed * 0.75);
                break;
            case 'range':
                this.range *= 1.3;
                break;
            case 'multishot':
                this.multishot++;
                break;
            case 'pierce':
                this.pierce += 2;
                break;
            case 'slow':
                this.slowChance = 0.3;
                break;
            case 'crit':
                this.critChance = 0.2;
                this.critMultiplier = 2;
                break;
            case 'chain':
                this.chainChance = 0.25;
                break;
            case 'explosion':
                this.explosion = true;
                break;
            case 'snipe':
                this.range *= 2;
                this.damage *= 1.5;
                break;
        }
    }
}

// ==================== 子弹类 ====================
class Bullet {
    constructor(x, y, vx, vy, damage, pierce, slowChance, critChance, critMultiplier, chainChance, explosion, lane) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.pierce = pierce;
        this.slowChance = slowChance;
        this.critChance = critChance;
        this.critMultiplier = critMultiplier;
        this.chainChance = chainChance;
        this.explosion = explosion;
        this.lane = lane;
        this.radius = CONFIG.BULLET_RADIUS;
        this.active = true;
        this.hitEnemies = [];
        this.isCrit = false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 超出屏幕
        if (this.x < 0 || this.x > CONFIG.CANVAS_WIDTH || 
            this.y < 0 || this.y > CONFIG.CANVAS_HEIGHT) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isCrit ? '#FFD700' : '#FF6B6B';
        ctx.fill();
        
        // 拖尾效果
        ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.vx * 2, this.y - this.vy * 2, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 暴击特效
        if (this.isCrit) {
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// ==================== 敌人类 ====================
class Enemy {
    constructor(wave, lane) {
        this.lane = lane;
        this.x = CONFIG.CANVAS_WIDTH + 50;
        this.y = 100 + lane * CONFIG.LANE_HEIGHT + 10;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE - 10;
        this.speed = 0.8 + wave * 0.15;
        this.maxHealth = 30 + wave * 15;
        this.health = this.maxHealth;
        this.damage = 1;
        this.active = true;
        this.slowEffect = 0;
        this.isBoss = wave % 5 === 0;
        this.color = this.isBoss ? '#9C27B0' : '#F44336';
        
        if (this.isBoss) {
            this.maxHealth *= 3;
            this.health = this.maxHealth;
            this.width = 60;
            this.height = 60;
        }
    }
    
    update() {
        // 减速效果
        let currentSpeed = this.speed;
        if (this.slowEffect > 0) {
            currentSpeed *= 0.5;
            this.slowEffect--;
        }
        
        this.x -= currentSpeed;
        
        // 到达防线
        if (this.x <= 50) {
            this.active = false;
            return 'reach_base';
        }
        return null;
    }
    
    takeDamage(damage, slowChance, critChance, critMultiplier, chainChance, explosion, enemies) {
        // 暴击判定
        let finalDamage = damage;
        if (Math.random() < critChance) {
            finalDamage *= critMultiplier;
            this.isCrit = true;
        }
        
        this.health -= finalDamage;
        
        // 减速效果
        if (Math.random() < slowChance) {
            this.slowEffect = 60;
        }
        
        // 连锁闪电
        if (Math.random() < chainChance) {
            this.chainLightning(enemies);
        }
        
        // 爆炸效果
        if (this.health <= 0 && explosion) {
            this.explosionDamage(enemies);
        }
        
        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }
    
    chainLightning(enemies) {
        for (let enemy of enemies) {
            if (enemy !== this && enemy.active && enemy.lane === this.lane) {
                const dx = enemy.x - this.x;
                const dist = Math.abs(dx);
                if (dist < 100) {
                    enemy.health -= 8;
                    break;
                }
            }
        }
    }
    
    explosionDamage(enemies) {
        for (let enemy of enemies) {
            if (enemy !== this && enemy.active && enemy.lane === this.lane) {
                const dx = enemy.x - this.x;
                const dist = Math.abs(dx);
                if (dist < 80) {
                    enemy.health -= 15;
                }
            }
        }
    }
    
    draw(ctx) {
        // 敌人身体
        ctx.fillStyle = this.color;
        
        if (this.isBoss) {
            // BOSS 画大一点
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // BOSS 光环
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // 普通敌人画成小怪物
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // 眼睛
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + 15, 6, 0, Math.PI * 2);
            ctx.arc(this.x + 28, this.y + 15, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + 15, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 28, this.y + 15, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 愤怒表情
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y + 8);
            ctx.lineTo(this.x + 16, this.y + 12);
            ctx.moveTo(this.x + 32, this.y + 8);
            ctx.lineTo(this.x + 24, this.y + 12);
            ctx.stroke();
        }
        
        // 血条
        const healthBarWidth = this.width;
        const healthBarHeight = 5;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth * healthPercent, healthBarHeight);
        
        // 减速效果
        if (this.slowEffect > 0) {
            ctx.strokeStyle = '#00BCD4';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
        }
    }
}

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.health = 20;
        this.maxHealth = 20;
        this.gold = 150;
        this.wave = 1;
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.enemySpawnTimer = 0;
        this.enemiesPerWave = 8;
        this.enemiesSpawned = 0;
        this.waveInProgress = false;
        this.playerSkills = {};
        this.towerCost = 80;
        
        this.setupInput();
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.running) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.placeTower(x, y);
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.running) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const touch = e.touches[0];
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            this.placeTower(x, y);
        }, { passive: false });
    }
    
    placeTower(x, y) {
        if (this.gold < this.towerCost) {
            this.showMessage('💰 金币不足！');
            return;
        }
        
        // 计算在哪条路径
        const lane = Math.floor((y - 100) / CONFIG.LANE_HEIGHT);
        if (lane < 0 || lane >= CONFIG.LANES) {
            this.showMessage('❌ 只能在草地上放置！');
            return;
        }
        
        const towerY = 100 + lane * CONFIG.LANE_HEIGHT + 10;
        
        // 检查是否已有塔
        for (let tower of this.towers) {
            if (tower.lane === lane && Math.abs(tower.x - x) < CONFIG.TOWER_SIZE) {
                this.showMessage('❌ 已有防御塔！');
                return;
            }
        }
        
        this.gold -= this.towerCost;
        const tower = new Tower(x - CONFIG.TOWER_SIZE / 2, towerY, lane);
        this.towers.push(tower);
        this.updateUI();
        this.showMessage('🏰 防御塔已放置！');
    }
    
    start() {
        this.health = 20;
        this.maxHealth = 20;
        this.gold = 150;
        this.wave = 1;
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.enemySpawnTimer = 0;
        this.enemiesSpawned = 0;
        this.waveInProgress = false;
        this.playerSkills = {};
        this.towerCost = 80;
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.running = true;
        this.updateUI();
        requestAnimationFrame(this.gameLoop);
        
        setTimeout(() => this.startWave(), 1000);
    }
    
    startWave() {
        this.enemiesPerWave = 8 + this.wave * 3;
        this.enemiesSpawned = 0;
        this.waveInProgress = true;
        this.showWaveMessage(`🌊 第 ${this.wave} 波敌人来袭！`);
    }
    
    spawnEnemy() {
        if (this.enemiesSpawned < this.enemiesPerWave) {
            const lane = Math.floor(Math.random() * CONFIG.LANES);
            this.enemies.push(new Enemy(this.wave, lane));
            this.enemiesSpawned++;
        }
    }
    
    update() {
        if (!this.running) return;
        
        // 生成敌人
        if (this.waveInProgress && this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = Math.max(20, 60 - this.wave * 3);
        } else {
            this.enemySpawnTimer--;
        }
        
        // 检查波次结束
        if (this.waveInProgress && this.enemiesSpawned >= this.enemiesPerWave && this.enemies.length === 0) {
            this.waveComplete();
        }
        
        // 更新防御塔
        for (let tower of this.towers) {
            tower.update(this.enemies, this.bullets);
        }
        
        // 更新子弹
        for (let bullet of this.bullets) {
            bullet.update();
        }
        
        // 更新敌人
        for (let enemy of this.enemies) {
            const result = enemy.update();
            if (result === 'reach_base') {
                this.health -= enemy.damage;
                this.updateUI();
                
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // 子弹敌人碰撞
        for (let bullet of this.bullets) {
            if (!bullet.active) continue;
            
            for (let enemy of this.enemies) {
                if (!enemy.active || enemy.lane !== bullet.lane) continue;
                
                const dx = bullet.x - (enemy.x + enemy.width / 2);
                const dy = bullet.y - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < bullet.radius + enemy.width / 2) {
                    const killed = enemy.takeDamage(
                        bullet.damage,
                        bullet.slowChance,
                        bullet.critChance,
                        bullet.critMultiplier,
                        bullet.chainChance,
                        bullet.explosion,
                        this.enemies
                    );
                    
                    bullet.hitEnemies.push(enemy);
                    
                    if (bullet.pierce <= 0 || bullet.hitEnemies.length > bullet.pierce) {
                        bullet.active = false;
                    }
                    
                    if (killed) {
                        const goldBonus = this.playerSkills.gold || 1;
                        const baseGold = enemy.isBoss ? 50 : 10;
                        this.gold += Math.floor(baseGold * goldBonus);
                        this.updateUI();
                    }
                    
                    break;
                }
            }
        }
        
        // 清理
        this.bullets = this.bullets.filter(b => b.active);
        this.enemies = this.enemies.filter(e => e.active);
    }
    
    waveComplete() {
        this.waveInProgress = false;
        this.wave++;
        this.updateUI();
        
        // 回血奖励
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + 3);
            this.updateUI();
        }
        
        this.showSkillSelect();
    }
    
    showSkillSelect() {
        const skillSelect = document.getElementById('skillSelect');
        const skillCards = document.getElementById('skillCards');
        
        const availableSkills = [...SKILLS];
        const selected = [];
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * availableSkills.length);
            selected.push(availableSkills[index]);
            availableSkills.splice(index, 1);
        }
        
        skillCards.innerHTML = '';
        for (let skill of selected) {
            const card = document.createElement('div');
            card.className = `skill-card skill-${skill.rarity}`;
            card.innerHTML = `
                <h3>${skill.name}</h3>
                <p>${skill.desc}</p>
            `;
            card.onclick = () => {
                this.selectSkill(skill);
            };
            skillCards.appendChild(card);
        }
        
        skillSelect.style.display = 'block';
    }
    
    selectSkill(skill) {
        for (let tower of this.towers) {
            tower.applySkill(skill.id);
        }
        
        if (!this.playerSkills[skill.id]) {
            this.playerSkills[skill.id] = 0;
        }
        this.playerSkills[skill.id]++;
        
        // 全局技能
        if (skill.id === 'gold') {
            this.playerSkills.gold = (this.playerSkills.gold || 1) + 0.3;
        }
        if (skill.id === 'health') {
            this.maxHealth += 5;
            this.health += 5;
            this.updateUI();
        }
        
        document.getElementById('skillSelect').style.display = 'none';
        this.showMessage(`✨ 获得 ${skill.name}！`);
        
        setTimeout(() => this.startWave(), 500);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.drawBackground();
        this.drawLanes();
        
        // 绘制防线
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(45, 0, 10, CONFIG.CANVAS_HEIGHT);
        
        // 绘制防御塔
        for (let tower of this.towers) {
            tower.draw(this.ctx);
        }
        
        // 绘制子弹
        for (let bullet of this.bullets) {
            bullet.draw(this.ctx);
        }
        
        // 绘制敌人
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
    }
    
    drawBackground() {
        // 天空
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 100);
        
        // 标题栏区域
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 100);
    }
    
    drawLanes() {
        // 5 条路径（草地）
        for (let i = 0; i < CONFIG.LANES; i++) {
            const y = 100 + i * CONFIG.LANE_HEIGHT;
            
            // 草地背景
            const laneGradient = this.ctx.createLinearGradient(0, y, 0, y + CONFIG.LANE_HEIGHT);
            laneGradient.addColorStop(0, '#4a7c23');
            laneGradient.addColorStop(1, '#3d6b1c');
            this.ctx.fillStyle = laneGradient;
            this.ctx.fillRect(50, y, CONFIG.CANVAS_WIDTH - 50, CONFIG.LANE_HEIGHT);
            
            // 路径分隔线
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(50, y);
            this.ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
        
        // 左侧基地
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(0, 0, 50, CONFIG.CANVAS_HEIGHT);
        
        // 基地装饰
        this.ctx.fillStyle = '#1976D2';
        this.ctx.beginPath();
        this.ctx.arc(25, CONFIG.CANVAS_HEIGHT / 2, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        if (!this.running) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    gameOver() {
        this.running = false;
        document.getElementById('gameOverTitle').textContent = '🏆 游戏结束';
        document.getElementById('finalScore').textContent = `存活波次：${this.wave - 1}`;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
    
    updateUI() {
        document.getElementById('health').textContent = `${this.health}/${this.maxHealth}`;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('gold').textContent = this.gold;
    }
    
    showMessage(text) {
        const msgEl = document.getElementById('message');
        msgEl.textContent = text;
        msgEl.style.opacity = '1';
        
        setTimeout(() => {
            msgEl.style.opacity = '0';
        }, 1500);
    }
    
    showWaveMessage(text) {
        const msgEl = document.getElementById('waveMessage');
        msgEl.textContent = text;
        msgEl.style.opacity = '1';
        
        setTimeout(() => {
            msgEl.style.opacity = '0';
        }, 2000);
    }
}

// ==================== 游戏初始化 ====================
const game = new Game();
