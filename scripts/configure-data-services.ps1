param([ValidateSet('Mongo','Jev')][string]$Kind='Mongo')
$ErrorActionPreference='Stop'
$projectPath=Split-Path -Parent $PSScriptRoot
$privatePath=Join-Path $projectPath 'data\cloud.env'
if(-not(Test-Path -LiteralPath $privatePath)){throw 'Create private data/cloud.env from cloud.env.example first.'}
Write-Host 'Musuroom - private server configuration. Values are hidden and stay outside Git.'
$secret=Read-Host $(if($Kind -eq 'Mongo'){'MongoDB Atlas connection URI (mongodb+srv://...)'}else{'JevAI personal key from www.jevai.org/agent/keys'}) -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try{
 $value=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
 if([string]::IsNullOrWhiteSpace($value) -or $value -match '[\r\n\s"''#]'){throw 'Use a non-empty value without whitespace/quotes. Encode reserved characters in URI passwords. No file changed.'}
 if($Kind -eq 'Mongo' -and $value -notmatch '^mongodb\+srv://'){throw 'Use the Atlas SRV URI. No file changed.'}
 $entries=if($Kind -eq 'Mongo'){@{MONGODB_URI=$value;MONGO_ENABLED='true';MONGODB_DATABASE='musuroom';MONGO_SOURCE_ID='musuroom-production'}}else{@{JEV_API_KEY=$value;JEV_ENABLED='true';JEV_MODEL='typesafe-ai/jev'}}
 $text=[IO.File]::ReadAllText($privatePath)
 foreach($key in $entries.Keys){
  $line=$key+'='+$entries[$key]
  if($text -match ('(?m)^'+$key+'=')){$text=[regex]::Replace($text,('(?m)^'+$key+'=[^\r\n]*'),[System.Text.RegularExpressions.MatchEvaluator]{param($match) $line})}
  else{$text=$text.TrimEnd()+[Environment]::NewLine+$line+[Environment]::NewLine}
 }
 [IO.File]::WriteAllText($privatePath,$text,[Text.UTF8Encoding]::new($false))
 Write-Host 'Saved to private data/cloud.env. No secret was printed.'
}finally{
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
 $value=$null;$text=$null;$entries=$null;$line=$null;$secret.Dispose()
}
