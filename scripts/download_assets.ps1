
$baseUrl = "https://huggingface.co/spaces/k2-fsa/web-assembly-zh-en-tts-matcha/resolve/main"
$modelUrl = "https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main"
$destDir = "public/sherpa-onnx-wasm"

if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir }

$files = @(
    @("sherpa-onnx-wasm-main-tts.js", "$baseUrl/sherpa-onnx-wasm-main-tts.js"),
    @("sherpa-onnx-wasm-main-tts.wasm", "$baseUrl/sherpa-onnx-wasm-main-tts.wasm"),
    @("sherpa-onnx-wasm-main-tts.data", "$baseUrl/sherpa-onnx-wasm-main-tts.data"),
    @("sherpa-onnx-tts.js", "$baseUrl/sherpa-onnx-tts.js"),
    @("model.onnx", "$modelUrl/vits-aishell3.int8.onnx"),
    @("tokens.txt", "$modelUrl/tokens.txt"),
    @("lexicon.txt", "$modelUrl/lexicon.txt")
)

foreach ($file in $files) {
    $name = $file[0]
    $url = $file[1]
    $outPath = Join-Path $destDir $name
    
    if (Test-Path $outPath) {
        $item = Get-Item $outPath
        if ($item.Length -gt 1000) {
            Write-Host "File $name already exists. Skipping."
            continue
        }
    }

    Write-Host "Downloading $name from $url..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
        Write-Host "Downloaded $name"
    } catch {
        Write-Error "Failed to download $name. Error: $_"
        exit 1
    }
}
Write-Host "All assets downloaded successfully."
