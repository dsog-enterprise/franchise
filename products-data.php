<?php
// This file serves as a fallback if database is not available
header('Content-Type: application/json');

$products = [
    [
        'id' => 1,
        'name' => 'Premium Leather Jacket',
        'description' => 'High-quality leather jacket for men with premium stitching and design.',
        'price' => 4500,
        'category' => 'mens',
        'images' => [
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
    ],
    // Add more sample products...
];

echo json_encode(['success' => true, 'data' => $products]);
?>
