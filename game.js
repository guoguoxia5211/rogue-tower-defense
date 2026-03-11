/**
 * 🏰 肉鸽塔防 - 核心游戏逻辑 v0.1.0
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 500,
    TOWER_SIZE: 40,
    ENEMY_SIZE: 30,
    BULLET_RADIUS: 8,
    FPS: 60
};

// ==================== 技能库 ====================
const SKILLS = [
    { id: 'damage', name: '攻击力 +', desc: '防御塔伤害 +20%', rarity: 'common' },
    { id: 'attackSpeed', name: '攻速 +', desc: '攻击速度 +25%', rarity: 'common' },
    { id: 'range', name: '射程 +', desc: '攻击范围 +30%', rarity: 'common' },
    { id: 'gold', name: '财富 +', desc: '金币获取 +30%', rarity: 'common' },
    { id: 'multishot', name: '多重射击', desc: '子弹数量 +1', rarity: 'rare' },
    { id: 'pierce', name: '穿透', desc: '子弹可穿透 2 个敌人', rarity: 'rare' },
    { id: 'slow', name: '冰冻', desc: '攻击有 30% 概率减速敌人', rarity: 'rare' },
    { id: 'crit', name: '暴击', desc: '20% 概率造成 200% 伤害', rarity: 'rare' },
    { id: 'chain', name: '连锁闪电', desc: '攻击有 25% 概率连锁 3 个敌人', rarity: 'epic' },
    { id: 'explosion', name: '爆炸', desc: '击杀敌人产生小范围爆炸', rarity: 'epic' }
];

// ==================== 防御塔类 ====================
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.TOWER_SIZE;
        this.height = CONFIG.TOWER_SIZE;
        this.range = 150;
        this.damage = 10;
        this.attackSpeed = 60; // 帧数间隔
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
        
        // 寻找范围内敌人
        const target = this.findTarget(enemies);
        if (target) {
            this.shoot(target, bullets);
            this.cooldown = this.attackSpeed;
        }
    }
    
    findTarget(enemies) {
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= this.range) {
                return enemy;
            }
        }
        return null;
    }
    
    shoot(target, bullets) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = 8;
        
        // 多重射击
        const bulletCount = 1 + this.multishot;
        for (let i = 0; i < bulletCount; i++) {
            const spreadAngle = angle + (i - (bulletCount - 1) / 2) * 0.2;
            bullets.push(new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                Math.cos(spreadAngle) * speed,
                Math.sin(spreadAngle) * speed,
                this.damage,
                this.pierce,
                this.slowChance,
                this.critChance,
                this.critMultiplier,
                this.chainChance,
                this.explosion
            ));
        }
    }
    
    draw(ctx) {
        // 塔座
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x - 5, this.y + this.height - 10, this.width + 10, 10);
        
        // 塔身
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 塔顶装饰
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 射程范围（调试用）
        // ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        // ctx.beginPath();
        // ctx.arc(this.x + this.width/2, this.y + this.height/2, this.range, 0, Math.PI * 2);
        // ctx.stroke();
    }
    
    applySkill(skillId) {
        switch(skillId) {
            case 'damage':
                this.damage *= 1.2;
                break;
            case 'attackSpeed':
                this.attackSpeed = Math.max(10, this.attackSpeed * 0.75);
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
        }
    }
}

// ==================== 子弹类 ====================
class Bullet {
    constructor(x, y, vx, vy, damage, pierce, slowChance, critChance, critMultiplier, chainChance, explosion) {
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
    constructor(wave) {
        this.x = CONFIG.CANVAS_WIDTH;
        this.y = CONFIG.GROUND_Y - CONFIG.ENEMY_SIZE;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE;
        this.speed = 1 + wave * 0.2;
        this.maxHealth = 20 + wave * 10;
        this.health = this.maxHealth;
        this.damage = 10;
        this.active = true;
        this.slowEffect = 0;
        this.color = wave % 5 === 0 ? '#9C27B0' : '#F44336'; // BOSS 是紫色
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
            // 这里可以添加暴击标记
        }
        
        this.health -= finalDamage;
        
        // 减速效果
        if (Math.random() < slowChance) {
            this.slowEffect = 60; // 减速 1 秒
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
            return true; // 死亡
        }
        return false;
    }
    
    chainLightning(enemies) {
        // 连锁闪电逻辑（简化版）
        for (let enemy of enemies) {
            if (enemy !== this && enemy.active) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    enemy.health -= 5;
                    break; // 只连锁一个
                }
            }
        }
    }
    
    explosionDamage(enemies) {
        // 爆炸伤害
        for (let enemy of enemies) {
            if (enemy !== this && enemy.active) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 80) {
                    enemy.health -= 10;
                }
            }
        }
    }
    
    draw(ctx) {
        // 敌人身体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 眼睛
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 10, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 22, this.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 22, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 血条
        const healthBarWidth = this.width;
        const healthBarHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 8, healthBarWidth, healthBarHeight);
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(this.x, this.y - 8, healthBarWidth * healthPercent, healthBarHeight);
        
        // 减速效果
        if (this.slowEffect > 0) {
            ctx.strokeStyle = '#00BCD4';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
    }
}

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.health = 100;
        this.gold = 100;
        this.wave = 1;
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.enemySpawnTimer = 0;
        this.enemiesPerWave = 5;
        this.enemiesSpawned = 0;
        this.waveInProgress = false;
        this.playerSkills = {};
        
        this.setupInput();
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    setupInput() {
        // 点击放置防御塔
        this.canvas.addEventListener('click', (e) => {
            if (!this.running) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.placeTower(x, y);
        });
        
        // 触摸支持
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
        const towerCost = 50;
        
        if (this.gold < towerCost) {
            this.showMessage('💰 金币不足！');
            return;
        }
        
        // 检查是否在有效区域
        if (y < 100 || y > CONFIG.GROUND_Y - CONFIG.TOWER_SIZE) {
            this.showMessage('❌ 无效位置！');
            return;
        }
        
        // 检查是否已有塔
        for (let tower of this.towers) {
            const dx = tower.x - x;
            const dy = tower.y - y;
            if (Math.abs(dx) < CONFIG.TOWER_SIZE && Math.abs(dy) < CONFIG.TOWER_SIZE) {
                this.showMessage('❌ 已有防御塔！');
                return;
            }
        }
        
        this.gold -= towerCost;
        const tower = new Tower(x - CONFIG.TOWER_SIZE / 2, y);
        this.towers.push(tower);
        this.updateUI();
    }
    
    start() {
        // 重置游戏状态
        this.health = 100;
        this.gold = 100;
        this.wave = 1;
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.enemySpawnTimer = 0;
        this.enemiesSpawned = 0;
        this.waveInProgress = true;
        this.playerSkills = {};
        
        // 隐藏界面
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.running = true;
        this.updateUI();
        requestAnimationFrame(this.gameLoop);
        
        this.startWave();
    }
    
    startWave() {
        this.enemiesPerWave = 5 + this.wave * 2;
        this.enemiesSpawned = 0;
        this.waveInProgress = true;
        this.showMessage(`🌊 第 ${this.wave} 波！`);
    }
    
    spawnEnemy() {
        if (this.enemiesSpawned < this.enemiesPerWave) {
            this.enemies.push(new Enemy(this.wave));
            this.enemiesSpawned++;
        }
    }
    
    update() {
        if (!this.running) return;
        
        // 生成敌人
        if (this.waveInProgress && this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = 60; // 1 秒生成一个
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
        
        // 更新敌人并检测碰撞
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
                if (!enemy.active) continue;
                
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
                        this.gold += Math.floor(10 * goldBonus);
                        this.updateUI();
                    }
                    
                    break;
                }
            }
        }
        
        // 清理非活动对象
        this.bullets = this.bullets.filter(b => b.active);
        this.enemies = this.enemies.filter(e => e.active);
    }
    
    waveComplete() {
        this.waveInProgress = false;
        this.wave++;
        this.updateUI();
        
        // 技能三选一
        this.showSkillSelect();
    }
    
    showSkillSelect() {
        const skillSelect = document.getElementById('skillSelect');
        const skillCards = document.getElementById('skillCards');
        
        // 随机选择 3 个技能
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
        // 应用技能
        for (let tower of this.towers) {
            tower.applySkill(skill.id);
        }
        
        // 记录玩家技能
        if (!this.playerSkills[skill.id]) {
            this.playerSkills[skill.id] = 0;
        }
        this.playerSkills[skill.id]++;
        
        // 特殊处理全局技能
        if (skill.id === 'gold') {
            this.playerSkills.gold = (this.playerSkills.gold || 1) + 0.3;
        }
        
        document.getElementById('skillSelect').style.display = 'none';
        this.showMessage(`✨ 获得 ${skill.name}！`);
        
        // 开始下一波
        setTimeout(() => this.startWave(), 500);
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制防线
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(50, 0, 5, CONFIG.CANVAS_HEIGHT);
        
        // 绘制地面
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
        
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
        // 天空渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.GROUND_Y);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y);
        
        // 云朵装饰
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(100, 80, 30, 0, Math.PI * 2);
        this.ctx.arc(140, 80, 40, 0, Math.PI * 2);
        this.ctx.arc(180, 80, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(500, 120, 25, 0, Math.PI * 2);
        this.ctx.arc(535, 120, 35, 0, Math.PI * 2);
        this.ctx.arc(570, 120, 25, 0, Math.PI * 2);
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
        document.getElementById('health').textContent = Math.max(0, this.health);
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
}

// ==================== 游戏初始化 ====================
const game = new Game();
