# Feed Service Test Script
# Tests all Feed Service endpoints

$baseUrl = "http://localhost:3004"
$userId = "d374f1eb-ed68-4cee-970f-d3db262be83d"

Write-Host "=== Feed Service API Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Create Post
Write-Host "2. Create Post" -ForegroundColor Yellow
try {
    $body = @{
        content = "This is a test post from the Feed Service!"
        is_prayer_request = $false
        feed_type = "primary"
        visibility = "public"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing

    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Post ID: $postId" -ForegroundColor Gray
    Write-Host "   Content: $($postData.data.content)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
    $postId = $null
}
Write-Host ""

# Test 3: Get Post
if ($postId) {
    Write-Host "3. Get Post" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId" `
            -Method GET `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing

        $postData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Post ID: $($postData.data.id)" -ForegroundColor Gray
        Write-Host "   Reaction Count: $($postData.data.reaction_count)" -ForegroundColor Gray
        Write-Host "   Comment Count: $($postData.data.comment_count)" -ForegroundColor Gray
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 4: List Posts
Write-Host "4. List Posts" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts?limit=10&offset=0" `
        -Method GET `
        -Headers @{"X-User-Id" = $userId} `
        -UseBasicParsing

    $postsData = $response.Content | ConvertFrom-Json
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Posts Count: $($postsData.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Add Reaction
if ($postId) {
    Write-Host "5. Add Reaction" -ForegroundColor Yellow
    try {
        $body = @{
            reaction_type = "like"
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing

        $reactionData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Reaction Type: $($reactionData.data.reaction_type)" -ForegroundColor Gray
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 6: Get Reactions
if ($postId) {
    Write-Host "6. Get Reactions" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
            -Method GET `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing

        $reactionsData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Reactions Count: $($reactionsData.data.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 7: Add Comment
if ($postId) {
    Write-Host "7. Add Comment" -ForegroundColor Yellow
    try {
        $body = @{
            content = "This is a test comment!"
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/comments" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing

        $commentData = $response.Content | ConvertFrom-Json
        $commentId = $commentData.data.id
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Comment ID: $commentId" -ForegroundColor Gray
        Write-Host "   Content: $($commentData.data.content)" -ForegroundColor Gray
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
        $commentId = $null
    }
    Write-Host ""
}

# Test 8: Get Comments
if ($postId) {
    Write-Host "8. Get Comments" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/comments?limit=10&offset=0" `
            -Method GET `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing

        $commentsData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Comments Count: $($commentsData.data.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 9: Update Post
if ($postId) {
    Write-Host "9. Update Post" -ForegroundColor Yellow
    try {
        $body = @{
            content = "This is an updated test post!"
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId" `
            -Method PUT `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing

        $postData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Updated Content: $($postData.data.content)" -ForegroundColor Gray
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 10: Create Prayer Request Post
Write-Host "10. Create Prayer Request Post" -ForegroundColor Yellow
try {
    $body = @{
        content = "Please pray for my family during this difficult time."
        is_prayer_request = $true
        feed_type = "prayer"
        visibility = "public"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing

    $prayerPostData = $response.Content | ConvertFrom-Json
    $prayerPostId = $prayerPostData.data.id
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Prayer Post ID: $prayerPostId" -ForegroundColor Gray
    Write-Host "   Is Prayer Request: $($prayerPostData.data.is_prayer_request)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 11: List Prayer Posts
Write-Host "11. List Prayer Posts" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts?feed_type=prayer&is_prayer_request=true&limit=10" `
        -Method GET `
        -Headers @{"X-User-Id" = $userId} `
        -UseBasicParsing

    $postsData = $response.Content | ConvertFrom-Json
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Prayer Posts Count: $($postsData.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 12: Metrics Endpoint
Write-Host "12. Metrics Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/metrics" -Method GET -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Metrics available (Prometheus format)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Tests Complete ===" -ForegroundColor Cyan

