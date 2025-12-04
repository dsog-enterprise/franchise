<?php
require_once '../config.php';
require_once '../functions.php';

$pageTitle = "Men's Collection";
$category = 'mens';

// Get products for this category
$products = getProducts($category, 20);
$productsCount = getProductsCount($category);

include '../includes/header.php';
?>

<section class="category-header">
    <div class="category-banner" style="background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1520975916090-3105956dac38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'); background-size: cover; background-position: center; padding: 4rem 2rem; text-align: center; color: white;">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary-gold);">Men's Collection</h1>
        <p style="font-size: 1.1rem; max-width: 600px; margin: 0 auto; opacity: 0.9;">Premium menswear for every occasion. Discover our curated collection of stylish and comfortable clothing.</p>
        <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
            <span class="product-count"><?php echo $productsCount; ?> Products</span>
        </div>
    </div>
</section>

<section class="products" style="padding: 3rem 1.5rem; max-width: 1400px; margin: 0 auto;">
    <div class="section-title">
        <h2>All Men's Products</h2>
        <p>Browse our complete collection of men's fashion</p>
    </div>
    
    <div class="products-grid">
        <?php if (empty($products)): ?>
        <div class="no-products" style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
            <i class="fas fa-search" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
            <h3>No products found</h3>
            <p>Check back soon for new arrivals!</p>
        </div>
        <?php else: ?>
        <?php foreach ($products as $product): ?>
        <div class="product-card" onclick="openProductModal(<?php echo htmlspecialchars(json_encode($product)); ?>)">
            <div class="product-image-wrapper">
                <img src="<?php echo $product['images_array'][0]; ?>" alt="<?php echo $product['name']; ?>" class="product-image" loading="lazy">
                <button class="view-image-btn" onclick="event.stopPropagation(); openFullImageView('<?php echo implode(',', $product['images_array']); ?>', '<?php echo addslashes($product['name']); ?>')">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
            <div class="product-info">
                <div class="product-badge"><?php echo ucfirst($product['category']); ?></div>
                <h3 class="product-title"><?php echo $product['name']; ?></h3>
                <div class="product-price">KSh <?php echo number_format($product['price']); ?></div>
                <p class="product-description"><?php echo substr($product['description'], 0, 100) . '...'; ?></p>
                <button class="whatsapp-btn" onclick="event.stopPropagation(); orderViaWhatsApp('<?php echo addslashes($product['name']); ?>', <?php echo $product['price']; ?>)">
                    <i class="fab fa-whatsapp"></i> Order via WhatsApp
                </button>
            </div>
        </div>
        <?php endforeach; ?>
        <?php endif; ?>
    </div>
</section>

<!-- Product Modal -->
<div class="product-modal" id="productModal">
    <div class="modal-content">
        <button class="modal-close" id="modalClose">
            <i class="fas fa-times"></i>
        </button>
        <div class="modal-body" id="modalBody">
            <!-- Modal content will be populated by JavaScript -->
        </div>
    </div>
</div>

<!-- Full Image View Modal -->
<div class="full-image-modal" id="fullImageModal">
    <!-- Same as index.php -->
</div>

<?php
include '../includes/footer.php';
?>
