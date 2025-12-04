<?php
require_once 'includes/db.php';

function getProducts($category = null, $limit = 12, $offset = 0) {
    $db = Database::getInstance()->getConnection();
    
    $sql = "SELECT * FROM products WHERE status = 'active'";
    
    if ($category && $category !== 'all') {
        $category = Database::getInstance()->escape($category);
        $sql .= " AND category = '$category'";
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
    
    $result = $db->query($sql);
    $products = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Convert images string to array
            if (!empty($row['images'])) {
                $row['images_array'] = explode(',', $row['images']);
            } else {
                $row['images_array'] = ['https://via.placeholder.com/500x500?text=DSOG+Product'];
            }
            $products[] = $row;
        }
    }
    
    return $products;
}

function getProductById($id) {
    $db = Database::getInstance()->getConnection();
    $id = Database::getInstance()->escape($id);
    
    $sql = "SELECT * FROM products WHERE id = '$id' AND status = 'active'";
    $result = $db->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $product = $result->fetch_assoc();
        
        // Convert images string to array
        if (!empty($product['images'])) {
            $product['images_array'] = explode(',', $product['images']);
        } else {
            $product['images_array'] = ['https://via.placeholder.com/500x500?text=DSOG+Product'];
        }
        
        return $product;
    }
    
    return null;
}

function getCollections() {
    $db = Database::getInstance()->getConnection();
    
    $sql = "SELECT * FROM collections WHERE status = 'active' ORDER BY display_order";
    $result = $db->query($sql);
    $collections = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $collections[] = $row;
        }
    }
    
    return $collections;
}

function getProductsCount($category = null) {
    $db = Database::getInstance()->getConnection();
    
    $sql = "SELECT COUNT(*) as count FROM products WHERE status = 'active'";
    
    if ($category && $category !== 'all') {
        $category = Database::getInstance()->escape($category);
        $sql .= " AND category = '$category'";
    }
    
    $result = $db->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['count'];
    }
    
    return 0;
}

function logOrder($productId, $productName, $price, $customerPhone = null) {
    $db = Database::getInstance()->getConnection();
    
    $productId = Database::getInstance()->escape($productId);
    $productName = Database::getInstance()->escape($productName);
    $price = Database::getInstance()->escape($price);
    $customerPhone = $customerPhone ? Database::getInstance()->escape($customerPhone) : null;
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    
    $sql = "INSERT INTO orders (product_id, product_name, price, customer_phone, ip_address, user_agent) 
            VALUES ('$productId', '$productName', '$price', '$customerPhone', '$ipAddress', '$userAgent')";
    
    return $db->query($sql);
}

function getFranchisee($code) {
    $franchisees = [
        'john' => [
            'name' => 'John Mwangi',
            'phone' => '254711222333',
            'location' => 'Nairobi CBD'
        ],
        'sarah' => [
            'name' => 'Sarah Atieno',
            'phone' => '254722333444',
            'location' => 'Westlands'
        ],
        'david' => [
            'name' => 'David Omondi',
            'phone' => '254733444555',
            'location' => 'Mombasa'
        ]
    ];
    
    return isset($franchisees[$code]) ? $franchisees[$code] : null;
}

function getCurrentFranchisee() {
    $franchisee = null;
    
    // Check URL parameter
    if (isset($_GET['franchisee']) || isset($_GET['ref'])) {
        $code = isset($_GET['franchisee']) ? $_GET['franchisee'] : $_GET['ref'];
        $franchisee = getFranchisee($code);
        
        if ($franchisee) {
            // Save to session
            $_SESSION['franchisee'] = [
                'code' => $code,
                'name' => $franchisee['name'],
                'phone' => $franchisee['phone'],
                'location' => $franchisee['location'],
                'timestamp' => time()
            ];
        }
    }
    
    // Check session
    if (!$franchisee && isset($_SESSION['franchisee'])) {
        $saved = $_SESSION['franchisee'];
        
        // Check if session is still valid (24 hours)
        if (time() - $saved['timestamp'] < 86400) {
            $franchisee = getFranchisee($saved['code']);
        } else {
            unset($_SESSION['franchisee']);
        }
    }
    
    return $franchisee;
}

function getWhatsAppNumber() {
    $franchisee = getCurrentFranchisee();
    return $franchisee ? $franchisee['phone'] : WHATSAPP_NUMBER;
}

function generateWhatsAppLink($productName, $price) {
    $whatsappNumber = getWhatsAppNumber();
    $franchisee = getCurrentFranchisee();
    $contactName = $franchisee ? $franchisee['name'] : 'DSOG STORES';
    
    $message = "Hello {$contactName}! I would like to order:\n\n" .
               "Product: {$productName}\n" .
               "Price: KSh {$price}\n\n" .
               "Please guide me through the ordering process.";
    
    if ($franchisee) {
        $message .= "\n\n---\nOrder placed through {$franchisee['name']} ({$franchisee['location']})";
    }
    
    $encodedMessage = urlencode($message);
    return "https://wa.me/{$whatsappNumber}?text={$encodedMessage}";
}

function displayNotification($message, $type = 'success') {
    $class = $type === 'error' ? 'error' : 'success';
    return "<div class='notification {$class}'>{$message}</div>";
}
?>
