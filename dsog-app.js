// DSOG STORES - Unified JavaScript Application
// Optimized for faster loading and better performance

// ================= CONFIGURATION =================
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby-iIbv89AN4tXwB1bxdw3GC4CPHDSFkkwrS9apdMH0ZLYBaY4aKYESnAZGUqGNmEmorA/exec',
    MAIN_WHATSAPP: '254733737983',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
    LAZY_LOAD_THRESHOLD: 200, // pixels from viewport
    MAX_PRODUCTS_PER_PAGE: 20
};

// ================= DATA MANAGEMENT =================
class DataManager {
    constructor() {
        this.cache = new Map();
        this.products = new Map(); // Collection name -> products
        this.loading = new Set();
    }

    async getProducts(collection) {
        const cacheKey = `products-${collection}`;
        const cached = this.getCached(cacheKey);
        
        if (cached) {
            console.log(`📦 Using cached ${collection} products`);
            return cached;
        }

        if (this.loading.has(cacheKey)) {
            console.log(`⏳ ${collection} products already loading...`);
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    const data = this.getCached(cacheKey);
                    if (data) {
                        clearInterval(checkInterval);
                        resolve(data);
                    }
                }, 100);
            });
        }

        this.loading.add(cacheKey);
        
        try {
            console.log(`📡 Fetching ${collection} products...`);
            const startTime = performance.now();
            
            const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getProducts&collection=${collection}&timestamp=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            const endTime = performance.now();
            
            console.log(`✅ ${collection} products loaded in ${Math.round(endTime - startTime)}ms`);
            
            if (result.success && result.data) {
                this.setCached(cacheKey, result.data);
                this.products.set(collection, result.data);
                return result.data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error(`❌ Error loading ${collection}:`, error);
            return this.getFallbackProducts(collection);
        } finally {
            this.loading.delete(cacheKey);
        }
    }

    getCached(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > CONFIG.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    setCached(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFallbackProducts(collection) {
        const fallbacks = {
            'mens': [
                { id: '1', name: 'Premium Hoodie', category: 'hoodie', basePrice: 8999, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', description: 'Premium quality hoodie for men' },
                { id: '2', name: 'Designer T-Shirt', category: 'tshirt', basePrice: 4550, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', description: 'Elegant designer t-shirt' }
            ],
            'womens': [
                { id: '3', name: 'Elegant Dress', category: 'dress', basePrice: 7999, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', description: 'Elegant women\'s dress' },
                { id: '4', name: 'Women\'s Blouse', category: 'blouse', basePrice: 5599, image: 'https://images.unsplash.com/photo-1585487000160-6eb9ce6b5aae?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', description: 'Premium women\'s blouse' }
            ],
            'kids': [
                { id: '5', name: 'Kids Hoodie Set', category: 'hoodie', basePrice: 3999, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', description: 'Comfortable kids hoodie set' },
                { id: '6', name: 'Kids T-Shirt Pack', category: 'tshirt', basePrice: 2999, image: 'https://images.unsplash.com/photo-1519238263530-99c7b8d26a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', description: 'Pack of 3 kids t-shirts' }
            ]
        };
        
        return fallbacks[collection] || fallbacks.mens;
    }

    clearCache() {
        this.cache.clear();
        this.products.clear();
    }
}

// ================= FRANCHISEE MANAGEMENT =================
class FranchiseeManager {
    constructor() {
        this.franchisees = {
            'john': { name: 'John Mwangi', phone: '254722111111', location: 'Nairobi CBD' },
            'sarah': { name: 'Sarah Atieno', phone: '254722222222', location: 'Westlands' },
            'david': { name: 'David Omondi', phone: '254722333333', location: 'Mombasa' },
            'grace': { name: 'Grace Wambui', phone: '254722444444', location: 'Kisumu' },
            'mike': { name: 'Mike Kamau', phone: '254722555555', location: 'Nakuru' },
            'linda': { name: 'Linda Chebet', phone: '254722666666', location: 'Thika' }
        };
        this.current = null;
    }

    detectFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const franchiseeCode = urlParams.get('franchisee') || urlParams.get('ref');
        
        if (franchiseeCode && this.franchisees[franchiseeCode]) {
            this.current = this.franchisees[franchiseeCode];
            console.log(`🎯 Franchisee: ${this.current.name}`);
            
            this.saveToStorage(franchiseeCode);
            return true;
        }
        
        return this.loadFromStorage();
    }

    saveToStorage(code) {
        localStorage.setItem('dsog_franchisee', JSON.stringify({
            code,
            name: this.current.name,
            phone: this.current.phone,
            location: this.current.location,
            timestamp: new Date().toISOString()
        }));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('dsog_franchisee');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.current = this.franchisees[data.code];
                return !!this.current;
            } catch (error) {
                console.error('Error loading franchisee:', error);
            }
        }
        return false;
    }

    getWhatsAppNumber() {
        return this.current ? this.current.phone : CONFIG.MAIN_WHATSAPP;
    }

    getContactName() {
        return this.current ? this.current.name : 'DSOG STORES';
    }
}

// ================= PRODUCT RENDERER =================
class ProductRenderer {
    constructor() {
        this.dataManager = new DataManager();
        this.lazyLoadObserver = null;
        this.initLazyLoading();
    }

    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        img.onload = () => {
                            img.style.animation = 'fadeIn 0.5s ease';
                        };
                        this.lazyLoadObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: `${CONFIG.LAZY_LOAD_THRESHOLD}px`,
                threshold: 0.1
            });
        }
    }

    createProductCard(product, collectionName = null) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const badge = collectionName || product.category || 'New';
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f8f8f8'/%3E%3C/svg%3E"
                     data-src="${product.image}"
                     alt="${product.name}"
                     class="product-image skeleton">
            </div>
            <div class="product-info">
                <div class="product-badge">${badge}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">KSh ${product.basePrice}</div>
                <p class="product-description">${product.description || 'Premium quality product from DSOG STORES.'}</p>
                <button class="whatsapp-btn" onclick="DSOG.orderViaWhatsApp('${product.name}', ${product.basePrice}, '${collectionName || product.collection || 'general'}')">
                    <i class="fab fa-whatsapp"></i> Order via WhatsApp
                </button>
            </div>
        `;
        
        // Add lazy loading
        const img = card.querySelector('.product-image');
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.observe(img);
        } else {
            // Fallback: Load immediately
            img.src = img.dataset.src;
            img.classList.add('loaded');
        }
        
        // Add click handler for modal
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('whatsapp-btn')) {
                DSOG.openModal(product, collectionName);
            }
        });
        
        return card;
    }

    renderProducts(containerId, products, collectionName = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear and show skeleton loading
        container.innerHTML = '';
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <p>No products found</p>
                    <button class="whatsapp-btn" onclick="window.open('https://wa.me/${CONFIG.MAIN_WHATSAPP}', '_blank')">
                        <i class="fab fa-whatsapp"></i> Request Products
                    </button>
                </div>
            `;
            return;
        }
        
        // Limit number of products for performance
        const displayProducts = products.slice(0, CONFIG.MAX_PRODUCTS_PER_PAGE);
        
        displayProducts.forEach(product => {
            const card = this.createProductCard(product, collectionName);
            container.appendChild(card);
        });
    }

    async loadAndRender(containerId, collectionName) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Show skeleton loading
        container.innerHTML = this.createSkeletonGrid();
        
        try {
            const products = await this.dataManager.getProducts(collectionName);
            this.renderProducts(containerId, products, collectionName);
        } catch (error) {
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Failed to load products. Please try again.</p>
                </div>
            `;
            console.error('Render error:', error);
        }
    }

    createSkeletonGrid() {
        return `
            <div class="product-card skeleton">
                <div class="skeleton skeleton-image"></div>
                <div class="product-info">
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 40%;"></div>
                    <div class="skeleton skeleton-text" style="height: 40px; margin-top: 10px;"></div>
                </div>
            </div>
        `.repeat(6);
    }
}

// ================= MODAL MANAGER =================
class ModalManager {
    constructor() {
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.init();
    }

    init() {
        const modal = document.getElementById('productModal');
        if (!modal) return;
        
        const modalClose = document.getElementById('modalClose') || modal.querySelector('.modal-close');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.close());
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(product, collectionName = null) {
        this.currentProduct = product;
        this.currentImageIndex = 0;
        
        const modal = document.getElementById('productModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) {
            console.error('Modal elements not found');
            return;
        }
        
        const productImages = product.images || [product.image];
        const badge = collectionName || product.category || 'Premium';
        
        modalBody.innerHTML = `
            <div class="modal-image-section">
                <div class="modal-image-container" id="modalImageContainer">
                    <img src="${productImages[0]}" alt="${product.name}" class="modal-image" id="modalMainImage">
                    <div class="zoom-hint">
                        <i class="fas fa-search-plus"></i>
                        Click to zoom
                    </div>
                </div>
                ${productImages.length > 1 ? `
                    <div class="image-gallery" id="imageGallery">
                        ${productImages.map((img, index) => `
                            <div class="gallery-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                                <img src="${img}" alt="${product.name} - View ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="modal-details">
                <h2 class="modal-title">${product.name}</h2>
                <div class="modal-price">KSh ${product.basePrice}</div>
                <div class="modal-category">${badge}</div>
                <p class="modal-description">${product.description || 'Premium quality product from DSOG STORES. Crafted with attention to detail.'}</p>
                <div style="margin-top: 1rem;">
                    ${product.availableColors ? `<p><strong>Available Colors:</strong> ${product.availableColors}</p>` : ''}
                    ${product.availableSizes ? `<p><strong>Available Sizes:</strong> ${product.availableSizes}</p>` : ''}
                    ${product.availableMaterials ? `<p><strong>Material:</strong> ${product.availableMaterials}</p>` : ''}
                </div>
                <button class="modal-whatsapp-btn" onclick="DSOG.orderViaWhatsApp('${product.name}', ${product.basePrice}, '${collectionName || product.collection || 'general'}')">
                    <i class="fab fa-whatsapp"></i> Order via WhatsApp
                </button>
            </div>
        `;
        
        this.initImageZoom();
        if (productImages.length > 1) {
            this.initImageGallery(productImages);
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    initImageZoom() {
        const imageContainer = document.getElementById('modalImageContainer');
        const mainImage = document.getElementById('modalMainImage');
        
        if (!imageContainer || !mainImage) return;
        
        imageContainer.addEventListener('click', () => {
            mainImage.classList.toggle('zoomed');
            
            if (mainImage.classList.contains('zoomed')) {
                imageContainer.style.cursor = 'zoom-out';
                const hint = imageContainer.querySelector('.zoom-hint');
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-search-minus"></i> Click to zoom out';
                }
            } else {
                imageContainer.style.cursor = 'zoom-in';
                const hint = imageContainer.querySelector('.zoom-hint');
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-search-plus"></i> Click to zoom';
                }
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!imageContainer.contains(e.target) && mainImage.classList.contains('zoomed')) {
                mainImage.classList.remove('zoomed');
                imageContainer.style.cursor = 'zoom-in';
                const hint = imageContainer.querySelector('.zoom-hint');
                if (hint) {
                    hint.innerHTML = '<i class="fas fa-search-plus"></i> Click to zoom';
                }
            }
        });
    }

    initImageGallery(images) {
        const thumbnails = document.querySelectorAll('.gallery-thumbnail');
        const mainImage = document.getElementById('modalMainImage');
        
        if (!thumbnails.length || !mainImage) return;
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.getAttribute('data-index'));
                this.currentImageIndex = index;
                
                mainImage.src = images[index];
                mainImage.classList.remove('zoomed');
                
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                
                const imageContainer = document.getElementById('modalImageContainer');
                if (imageContainer) {
                    imageContainer.style.cursor = 'zoom-in';
                    const hint = imageContainer.querySelector('.zoom-hint');
                    if (hint) {
                        hint.innerHTML = '<i class="fas fa-search-plus"></i> Click to zoom';
                    }
                }
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.currentImageIndex > 0) {
                const prevThumb = document.querySelector(`.gallery-thumbnail[data-index="${this.currentImageIndex - 1}"]`);
                if (prevThumb) prevThumb.click();
            } else if (e.key === 'ArrowRight' && this.currentImageIndex < images.length - 1) {
                const nextThumb = document.querySelector(`.gallery-thumbnail[data-index="${this.currentImageIndex + 1}"]`);
                if (nextThumb) nextThumb.click();
            }
        });
    }

    close() {
        const modal = document.getElementById('productModal');
        if (!modal) return;
        
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.currentProduct = null;
        this.currentImageIndex = 0;
    }
}

// ================= MOBILE MENU =================
class MobileMenu {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const menuBackdrop = document.getElementById('menuBackdrop');
        const closeMenu = document.getElementById('closeMenu');
        
        if (!hamburgerBtn || !mobileMenu || !menuBackdrop) return;
        
        hamburgerBtn.addEventListener('click', () => this.toggle());
        
        if (closeMenu) {
            closeMenu.addEventListener('click', () => this.close());
        }
        
        menuBackdrop.addEventListener('click', () => this.close());
        
        const mobileLinks = document.querySelectorAll('.mobile-nav-links a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => this.close());
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const menuBackdrop = document.getElementById('menuBackdrop');
        
        if (!hamburgerBtn || !mobileMenu || !menuBackdrop) return;
        
        mobileMenu.classList.add('active');
        menuBackdrop.classList.add('active');
        hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
    }

    close() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const menuBackdrop = document.getElementById('menuBackdrop');
        
        if (!hamburgerBtn || !mobileMenu || !menuBackdrop) return;
        
        mobileMenu.classList.remove('active');
        menuBackdrop.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.isOpen = false;
    }
}

// ================= BOTTOM NAVIGATION =================
class BottomNavigation {
    constructor() {
        this.init();
    }

    init() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const targetId = item.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        setTimeout(() => {
                            this.setActive(item);
                        }, 500);
                    }
                } else {
                    this.setActive(item);
                }
            });
        });
        
        // Set active based on current page
        this.setActiveBasedOnPage();
    }

    setActive(clickedItem) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        clickedItem.classList.add('active');
    }

    setActiveBasedOnPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                item.classList.add('active');
            }
        });
    }
}

// ================= CHAT BOT =================
class ChatBot {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        const chatToggle = document.getElementById('chatBotToggle');
        const chatContainer = document.getElementById('chatBotContainer');
        
        if (!chatToggle || !chatContainer) return;
        
        chatToggle.addEventListener('click', () => this.toggle());
        
        document.addEventListener('click', (e) => {
            if (!chatContainer.contains(e.target) && !chatToggle.contains(e.target) && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        const chatContainer = document.getElementById('chatBotContainer');
        const chatToggle = document.getElementById('chatBotToggle');
        
        if (!chatContainer || !chatToggle) return;
        
        this.isOpen = !this.isOpen;
        chatContainer.classList.toggle('active');
        
        if (this.isOpen) {
            chatToggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                chatToggle.style.transform = '';
            }, 300);
        }
    }

    close() {
        const chatContainer = document.getElementById('chatBotContainer');
        if (!chatContainer) return;
        
        chatContainer.classList.remove('active');
        this.isOpen = false;
    }

    addMessage(text, sender = 'bot') {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// ================= UTILITIES =================
class Utils {
    static showNotification(message, duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
    
    static getCurrentCollection() {
        const path = window.location.pathname;
        if (path.includes('mens')) return 'mens';
        if (path.includes('womens')) return 'womens';
        if (path.includes('kids')) return 'kids';
        if (path.includes('accessories')) return 'accessories';
        if (path.includes('gifts')) return 'gifts';
        return 'home';
    }
}

// ================= MAIN DSOG APPLICATION =================
class DSOGApp {
    constructor() {
        this.dataManager = new DataManager();
        this.franchiseeManager = new FranchiseeManager();
        this.productRenderer = new ProductRenderer();
        this.modalManager = new ModalManager();
        this.mobileMenu = new MobileMenu();
        this.bottomNav = new BottomNavigation();
        this.chatBot = new ChatBot();
        
        this.init();
    }

    init() {
        console.log('🚀 DSOG STORES - Unified Application Initialized');
        
        // Detect franchisee
        this.franchiseeManager.detectFromURL();
        
        // Update franchisee name in chat if element exists
        this.updateFranchiseeChatName();
        
        // Auto-initialize based on page
        this.autoInitializePage();
        
        // Preload important collections in background
        this.preloadCollections();
    }

    updateFranchiseeChatName() {
        const chatNameElement = document.getElementById('franchiseeChatName');
        const nameDisplayElement = document.getElementById('franchiseeNameDisplay');
        
        if (!chatNameElement || !nameDisplayElement) return;
        
        if (this.franchiseeManager.current) {
            chatNameElement.textContent = this.franchiseeManager.current.name;
            nameDisplayElement.textContent = `DSOG ${this.franchiseeManager.current.location}`;
        }
    }

    autoInitializePage() {
        const currentCollection = Utils.getCurrentCollection();
        
        switch(currentCollection) {
            case 'home':
                this.initHomePage();
                break;
            case 'mens':
            case 'womens':
            case 'kids':
            case 'accessories':
            case 'gifts':
                this.initCollectionPage(currentCollection);
                break;
        }
    }

    initHomePage() {
        // Initialize hero slideshow if exists
        if (document.getElementById('heroSlides')) {
            this.initHeroSlideshow();
        }
        
        // Load collections if exists
        if (document.getElementById('collectionsContainer')) {
            this.loadCollections();
        }
        
        // Load featured products if exists
        if (document.getElementById('productsContainer')) {
            this.loadFeaturedProducts();
        }
        
        // Load gifts if exists
        if (document.getElementById('giftsContainer')) {
            this.loadGifts();
        }
    }

    initCollectionPage(collectionName) {
        // Set collection hero background
        const hero = document.querySelector('.collection-hero');
        if (hero && !hero.style.backgroundImage.includes('url')) {
            const backgrounds = {
                'mens': 'https://images.unsplash.com/photo-1520975916090-3105956dac38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                'womens': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                'kids': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                'accessories': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                'gifts': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
            };
            
            hero.style.background = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${backgrounds[collectionName] || backgrounds.mens}')`;
            hero.style.backgroundSize = 'cover';
            hero.style.backgroundPosition = 'center';
        }
        
        // Load products for this collection
        if (document.getElementById('productsContainer')) {
            this.productRenderer.loadAndRender('productsContainer', collectionName);
        }
        
        // Initialize filters if exists
        if (document.getElementById('filtersContainer')) {
            this.initFilters(collectionName);
        }
    }

    initHeroSlideshow() {
        const heroSlides = [
            {
                image: 'https://i.postimg.cc/P5g46hcZ/Black-White-Minimal-Simple-Modern-Creative-Studio-Ego-Logo-3.webp',
                title: 'DSOG Collections',
                subtitle: 'Premium fashion for everyone'
            },
            {
                image: 'https://i.postimg.cc/SN01T6MK/Black-White-Minimal-Simple-Modern-Creative-Studio-Ego-Logo-4.webp',
                title: 'New Arrivals',
                subtitle: 'Fresh styles every season'
            },
            {
                image: 'https://i.postimg.cc/44wbtpQ1/Black-White-Minimal-Simple-Modern-Creative-Studio-Ego-Logo-5.webp',
                title: 'Direct WhatsApp Ordering',
                subtitle: 'Shop instantly via WhatsApp'
            }
        ];
        
        const slidesContainer = document.getElementById('heroSlides');
        const dotsContainer = document.getElementById('heroDots');
        
        if (!slidesContainer || !dotsContainer) return;
        
        // Create slides and dots
        heroSlides.forEach((slide, index) => {
            const slideElement = document.createElement('div');
            slideElement.className = `hero-slide ${index === 0 ? 'active' : ''}`;
            slideElement.innerHTML = `
                <img src="${slide.image}" alt="${slide.title}" loading="lazy">
                <div class="hero-overlay">
                    <h1 class="hero-title">${slide.title}</h1>
                    <p class="hero-subtitle">${slide.subtitle}</p>
                </div>
            `;
            slidesContainer.appendChild(slideElement);
            
            const dot = document.createElement('div');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.showSlide(index));
            dotsContainer.appendChild(dot);
        });
        
        // Auto-advance
        let currentSlide = 0;
        setInterval(() => {
            currentSlide = (currentSlide + 1) % heroSlides.length;
            this.showSlide(currentSlide);
        }, 5000);
    }

    showSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    loadCollections() {
        const collections = [
            {
                image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                title: 'Men\'s Collection',
                description: 'Premium menswear for every occasion',
                link: 'mens.html'
            },
            {
                image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                title: 'Women\'s Collection',
                description: 'Elegant womenswear for all styles',
                link: 'womens.html'
            },
            {
                image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                title: 'Kids Collection',
                description: 'Comfortable kids wear',
                link: 'kids.html'
            },
            {
                image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                title: 'Accessories',
                description: 'Complete your fashion look',
                link: 'accessories.html'
            },
            {
                image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                title: 'Gifts',
                description: 'Perfect presents for special occasions',
                link: 'gifts.html'
            }
        ];
        
        const container = document.getElementById('collectionsContainer');
        if (!container) return;
        
        collections.forEach(collection => {
            const card = document.createElement('a');
            card.className = 'collection-card';
            card.href = collection.link;
            card.innerHTML = `
                <img src="${collection.image}" alt="${collection.title}" class="collection-image" loading="lazy">
                <div class="collection-overlay">
                    <h3 class="collection-title">${collection.title}</h3>
                    <p class="collection-description">${collection.description}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async loadFeaturedProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;
        
        // Show loading
        container.innerHTML = this.productRenderer.createSkeletonGrid();
        
        try {
            // Load 2 products from each main collection
            const collections = ['mens', 'womens', 'kids'];
            const allProducts = [];
            
            // Load in parallel for speed
            const promises = collections.map(async collection => {
                try {
                    const products = await this.dataManager.getProducts(collection);
                    return products.slice(0, 2).map(p => ({...p, collectionName: collection}));
                } catch (error) {
                    return [];
                }
            });
            
            const results = await Promise.allSettled(promises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    allProducts.push(...result.value);
                }
            });
            
            if (allProducts.length > 0) {
                this.productRenderer.renderProducts('productsContainer', allProducts.slice(0, 8));
            } else {
                throw new Error('No products found');
            }
        } catch (error) {
            console.error('Error loading featured:', error);
            container.innerHTML = `
                <div class="loading">
                    <p>Failed to load featured products</p>
                    <button class="whatsapp-btn" onclick="window.open('https://wa.me/${CONFIG.MAIN_WHATSAPP}', '_blank')">
                        <i class="fab fa-whatsapp"></i> Browse Collections
                    </button>
                </div>
            `;
        }
    }

    loadGifts() {
        const giftsData = [
            {
                icon: 'fas fa-gift',
                title: 'Gift Box Sets',
                description: 'Curated fashion gift packages for special occasions'
            },
            {
                icon: 'fas fa-tshirt',
                title: 'Custom Bundles',
                description: 'Create your own gift bundle with multiple items'
            },
            {
                icon: 'fas fa-shipping-fast',
                title: 'Express Delivery',
                description: 'Special gift wrapping and fast delivery options'
            },
            {
                icon: 'fas fa-star',
                title: 'Premium Packaging',
                description: 'Luxury packaging for the perfect presentation'
            }
        ];
        
        const container = document.getElementById('giftsContainer');
        if (!container) return;
        
        giftsData.forEach(gift => {
            const card = document.createElement('div');
            card.className = 'gift-card';
            card.innerHTML = `
                <div class="gift-icon">
                    <i class="${gift.icon}"></i>
                </div>
                <h3 class="gift-title">${gift.title}</h3>
                <p class="gift-description">${gift.description}</p>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = 'gifts.html';
            });
            
            container.appendChild(card);
        });
    }

    initFilters(collectionName) {
        const filters = {
            'mens': [
                { id: 'all', name: 'All Products' },
                { id: 'hoodie', name: 'Hoodies' },
                { id: 'tshirt', name: 'T-Shirts' },
                { id: 'jacket', name: 'Jackets' },
                { id: 'pants', name: 'Pants' },
                { id: 'shoes', name: 'Shoes' }
            ],
            'womens': [
                { id: 'all', name: 'All Products' },
                { id: 'dress', name: 'Dresses' },
                { id: 'blouse', name: 'Blouses' },
                { id: 'skirt', name: 'Skirts' },
                { id: 'pants', name: 'Pants' },
                { id: 'accessories', name: 'Accessories' }
            ],
            'kids': [
                { id: 'all', name: 'All Products' },
                { id: 'hoodie', name: 'Hoodies' },
                { id: 'tshirt', name: 'T-Shirts' },
                { id: 'shorts', name: 'Shorts' },
                { id: 'set', name: 'Sets' },
                { id: 'shoes', name: 'Shoes' }
            ]
        };
        
        const collectionFilters = filters[collectionName] || filters.mens;
        const container = document.getElementById('filtersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        collectionFilters.forEach(filter => {
            const button = document.createElement('button');
            button.className = `filter-btn ${filter.id === 'all' ? 'active' : ''}`;
            button.textContent = filter.name;
            button.setAttribute('data-filter', filter.id);
            
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                this.filterProducts(container, filter.id, collectionName);
            });
            
            container.appendChild(button);
        });
    }

    async filterProducts(container, filter, collectionName) {
        const productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) return;
        
        // Show loading
        productsContainer.innerHTML = this.productRenderer.createSkeletonGrid();
        
        try {
            const products = await this.dataManager.getProducts(collectionName);
            
            let filteredProducts;
            if (filter === 'all') {
                filteredProducts = products;
            } else {
                filteredProducts = products.filter(product => 
                    product.category && product.category.toLowerCase() === filter
                );
            }
            
            this.productRenderer.renderProducts('productsContainer', filteredProducts, collectionName);
            
            if (filteredProducts.length === 0) {
                productsContainer.innerHTML = `
                    <div class="loading">
                        <p>No products found in this category</p>
                        <button class="whatsapp-btn" onclick="window.open('https://wa.me/${CONFIG.MAIN_WHATSAPP}', '_blank')">
                            <i class="fab fa-whatsapp"></i> Request Products
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Filter error:', error);
        }
    }

    orderViaWhatsApp(productName, price, collection = 'general') {
        const whatsappNumber = this.franchiseeManager.getWhatsAppNumber();
        const contactName = this.franchiseeManager.getContactName();
        
        let message = `Hello ${contactName}! I would like to order:\n\n` +
                     `Product: ${productName}\n` +
                     `Price: KSh ${price}\n` +
                     `Collection: ${collection.charAt(0).toUpperCase() + collection.slice(1)}\n\n` +
                     `Please guide me through the ordering process.`;
        
        if (this.franchiseeManager.current) {
            message += `\n\n---\nOrder placed through ${this.franchiseeManager.current.name} (${this.franchiseeManager.current.location})`;
        }
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        Utils.showNotification(`Opening WhatsApp to order ${productName}`);
    }

    openModal(product, collectionName = null) {
        this.modalManager.open(product, collectionName);
    }

    preloadCollections() {
        // Preload next likely collection in background
        const current = Utils.getCurrentCollection();
        const collectionsToPreload = {
            'home': ['mens', 'womens'],
            'mens': ['womens', 'kids'],
            'womens': ['mens', 'accessories'],
            'kids': ['mens', 'gifts']
        };
        
        const preloadList = collectionsToPreload[current] || ['mens', 'womens'];
        
        preloadList.forEach(collection => {
            setTimeout(() => {
                this.dataManager.getProducts(collection).catch(() => {});
            }, 1000);
        });
    }
}

// ================= GLOBAL INITIALIZATION =================
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.DSOG = new DSOGApp();
});

// Make important functions globally available
window.orderViaWhatsApp = (productName, price, collection) => {
    if (window.DSOG) {
        window.DSOG.orderViaWhatsApp(productName, price, collection);
    }
};

window.openModal = (product, collectionName) => {
    if (window.DSOG) {
        window.DSOG.openModal(product, collectionName);
    }
};

window.closeMobileMenu = () => {
    if (window.DSOG && window.DSOG.mobileMenu) {
        window.DSOG.mobileMenu.close();
    }
};

// Add CSS for dynamic elements
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    .product-image-container {
        position: relative;
        overflow: hidden;
    }
    
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-red);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 30px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        font-weight: 600;
        border: 2px solid var(--primary-gold);
        backdrop-filter: blur(10px);
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(dynamicStyles);
