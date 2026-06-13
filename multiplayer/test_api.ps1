$headers = @{ 'Content-Type' = 'application/json' }
$response = Invoke-RestMethod -Uri 'http://localhost:8003/api/reset' -Method Post -Headers $headers -Body '{}' -UseBasicParsing
Write-Host "RESET OK"
$body1 = '{"playerName":"Alice","maxPlayers":2,"avatar":"🐵"}'
$resp1 = Invoke-RestMethod -Uri 'http://localhost:8003/api/join' -Method Post -Headers $headers -Body $body1 -UseBasicParsing
Write-Host "JOIN1 players=$($resp1.players.Count) max=$($resp1.maxPlayers) cards=$($resp1.cards.Count)"
$body2 = '{"playerName":"Bob","maxPlayers":2,"avatar":"🐶"}'
$resp2 = Invoke-RestMethod -Uri 'http://localhost:8003/api/join' -Method Post -Headers $headers -Body $body2 -UseBasicParsing
Write-Host "JOIN2 players=$($resp2.players.Count) max=$($resp2.maxPlayers) cards=$($resp2.cards.Count)"
$state = Invoke-RestMethod -Uri 'http://localhost:8003/api/state?playerName=Alice' -Method Get -UseBasicParsing
Write-Host "STATE players=$($state.players.Count) cards=$($state.cards.Count) current=$($state.currentPlayer)"
