# Feed Service Edge Case Tests
# Tests edge cases, error conditions, and boundary conditions

$baseUrl = "http://localhost:3004"
$userId = "d374f1eb-ed68-4cee-970f-d3db262be83d"
$otherUserId = "test-user-other-123"

Write-Host "=== Feed Service Edge Case Tests ===" -ForegroundColor Cyan
Write-Host ""

$testCount = 0
$passCount = 0
$failCount = 0

function Test-EdgeCase {
    param(
        [string]$TestName,
        [scriptblock]$TestScript,
        [bool]$ShouldPass = $true
    )
    
    $script:testCount++
    Write-Host "$testCount. $TestName" -ForegroundColor Yellow
    
    try {
        $result = & $TestScript
        if ($ShouldPass) {
            Write-Host "   ✅ PASS" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "   ✅ PASS (Expected failure)" -ForegroundColor Green
            $script:passCount++
        }
        return $result
    } catch {
        if (-not $ShouldPass) {
            Write-Host "   ✅ PASS (Expected failure)" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "   ❌ FAIL: $_" -ForegroundColor Red
            $script:failCount++
        }
        return $null
    }
    Write-Host ""
}

# Test 1: Invalid Post ID (Non-UUID)
Test-EdgeCase "Invalid Post ID (Non-UUID)" {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/invalid-id" `
            -Method GET `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing `
            -ErrorAction Stop
        # If it returns 404, that's correct
        if ($response.StatusCode -eq 404) { return $true }
        throw "Expected 404, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) { return $true }
        # Check response content for POST_NOT_FOUND
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $stream = $errorResponse.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            if ($responseBody -like "*POST_NOT_FOUND*") { return $true }
        }
        throw $_
    }
} -ShouldPass $true

# Test 2: Non-existent Post ID
Test-EdgeCase "Non-existent Post ID" {
    $fakeId = "00000000-0000-0000-0000-000000000000"
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$fakeId" `
            -Method GET `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing `
            -ErrorAction Stop
        if ($response.StatusCode -eq 404) { return $true }
        throw "Expected 404, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) { return $true }
        # Check response content for POST_NOT_FOUND
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $stream = $errorResponse.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            if ($responseBody -like "*POST_NOT_FOUND*") { return $true }
        }
        throw $_
    }
} -ShouldPass $true

# Test 3: Empty Content
Test-EdgeCase "Empty Content (Should Fail)" {
    $body = @{
        content = ""
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected validation error, got $($response.StatusCode)"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 4: Very Long Content
Test-EdgeCase "Very Long Content (5000+ chars)" {
    $longContent = "A" * 5001
    $body = @{
        content = $longContent
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected validation error, got $($response.StatusCode)"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 5: Invalid Reaction Type
Test-EdgeCase "Invalid Reaction Type" {
    # First create a post
    $body = @{
        content = "Test post for invalid reaction"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try invalid reaction type
    $reactionBody = @{
        reaction_type = "invalid_reaction"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $reactionBody `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected validation error, got $($response.StatusCode)"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 6: Update Post by Non-Owner
Test-EdgeCase "Update Post by Non-Owner (Should Fail)" {
    # Create post with userId
    $body = @{
        content = "Post to be updated by non-owner"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try to update with different user
    $updateBody = @{
        content = "Hacked content"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId" `
            -Method PUT `
            -Headers @{"X-User-Id" = $otherUserId; "Content-Type" = "application/json"} `
            -Body $updateBody `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected 401/403, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 7: Delete Post by Non-Owner
Test-EdgeCase "Delete Post by Non-Owner (Should Fail)" {
    # Create post
    $body = @{
        content = "Post to be deleted by non-owner"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try to delete with different user
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId" `
            -Method DELETE `
            -Headers @{"X-User-Id" = $otherUserId} `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected 401/403, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 8: Add Comment to Non-existent Post
Test-EdgeCase "Add Comment to Non-existent Post" {
    $fakeId = "00000000-0000-0000-0000-000000000000"
    $body = @{
        content = "Comment on non-existent post"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$fakeId/comments" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected 404, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 9: Very Long Comment
Test-EdgeCase "Very Long Comment (2000+ chars)" {
    # Create post
    $body = @{
        content = "Post for long comment"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try very long comment
    $longComment = "A" * 2001
    $commentBody = @{
        content = $longComment
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/comments" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $commentBody `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected validation error, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 10: Pagination - Negative Offset
Test-EdgeCase "Pagination with Negative Offset" {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts?limit=10&offset=-1" `
            -Method GET `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing `
            -ErrorAction Stop
        # Should either reject or treat as 0
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) { return $true }
        throw "Unexpected status: $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 11: Pagination - Very Large Limit
Test-EdgeCase "Pagination with Very Large Limit" {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts?limit=10000&offset=0" `
        -Method GET `
        -Headers @{"X-User-Id" = $userId} `
        -UseBasicParsing
    # Should either cap the limit or reject
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) { return $true }
    throw "Unexpected status: $($response.StatusCode)"
} -ShouldPass $true

# Test 12: Duplicate Reaction (Same Type)
Test-EdgeCase "Duplicate Reaction (Same Type)" {
    # Create post
    $body = @{
        content = "Post for duplicate reaction test"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Add reaction
    $reactionBody = @{
        reaction_type = "like"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $reactionBody `
        -UseBasicParsing

    # Try to add same reaction again
    $response2 = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $reactionBody `
        -UseBasicParsing

    # Should either update or return existing (idempotent)
    if ($response2.StatusCode -eq 200) { return $true }
    throw "Unexpected status: $($response2.StatusCode)"
} -ShouldPass $true

# Test 13: Change Reaction Type
Test-EdgeCase "Change Reaction Type" {
    # Create post
    $body = @{
        content = "Post for reaction change test"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Add "like" reaction
    $reactionBody1 = @{
        reaction_type = "like"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $reactionBody1 `
        -UseBasicParsing

    # Change to "love" reaction
    $reactionBody2 = @{
        reaction_type = "love"
    } | ConvertTo-Json

    $response2 = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $reactionBody2 `
        -UseBasicParsing

    if ($response2.StatusCode -eq 200) { return $true }
    throw "Unexpected status: $($response2.StatusCode)"
} -ShouldPass $true

# Test 14: Nested Comment with Invalid Parent
Test-EdgeCase "Nested Comment with Invalid Parent ID" {
    # Create post
    $body = @{
        content = "Post for nested comment test"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try to add comment with invalid parent
    $fakeParentId = "00000000-0000-0000-0000-000000000000"
    $commentBody = @{
        content = "Reply to non-existent comment"
        parent_comment_id = $fakeParentId
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/comments" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $commentBody `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected 404, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 15: Missing Required Fields
Test-EdgeCase "Missing Required Fields" {
    $body = @{} | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected validation error, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 16: Special Characters in Content
Test-EdgeCase "Special Characters in Content" {
    $specialContent = 'Test with special chars: <>&"''; SQL: DROP TABLE posts; --'
    $body = @{
        content = $specialContent
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing

    if ($response.StatusCode -eq 201) {
        $postData = $response.Content | ConvertFrom-Json
        # Verify content is stored correctly (not executed as SQL)
        if ($postData.data.content -eq $specialContent) { return $true }
        throw "Content mismatch"
    }
    throw "Unexpected status: $($response.StatusCode)"
} -ShouldPass $true

# Test 17: Invalid Media URL Format
Test-EdgeCase "Invalid Media URL Format" {
    $body = @{
        content = "Post with invalid media URL"
        media_url = "not-a-valid-url"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        # May or may not validate URL format
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 18: Remove Non-existent Reaction
Test-EdgeCase "Remove Non-existent Reaction" {
    # Create post
    $body = @{
        content = "Post for remove reaction test"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try to remove reaction that doesn't exist
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/reactions?reaction_type=prayer" `
            -Method DELETE `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing `
            -ErrorAction Stop
        # Should either succeed (idempotent) or return 404
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) { return $true }
        throw "Unexpected status: $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 19: Delete Non-existent Comment
Test-EdgeCase "Delete Non-existent Comment" {
    $fakeCommentId = "00000000-0000-0000-0000-000000000000"

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/comments/$fakeCommentId" `
            -Method DELETE `
            -Headers @{"X-User-Id" = $userId} `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected 404, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) { return $true }
        throw $_
    }
} -ShouldPass $true

# Test 20: Empty Comment Content
Test-EdgeCase "Empty Comment Content (Should Fail)" {
    # Create post
    $body = @{
        content = "Post for empty comment test"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts" `
        -Method POST `
        -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing
    $postData = $response.Content | ConvertFrom-Json
    $postId = $postData.data.id

    # Try empty comment
    $commentBody = @{
        content = ""
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/feed/posts/$postId/comments" `
            -Method POST `
            -Headers @{"X-User-Id" = $userId; "Content-Type" = "application/json"} `
            -Body $commentBody `
            -UseBasicParsing `
            -ErrorAction Stop
        throw "Expected validation error, got $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) { return $true }
        throw $_
    }
} -ShouldPass $true

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total Tests: $testCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✅ All edge case tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed. Review the output above." -ForegroundColor Red
}

