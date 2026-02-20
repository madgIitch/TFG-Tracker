Set-StrictMode -Version Latest

# Session-scoped file read auditing for PowerShell.
# Usage:
#   . .\scripts\read-audit.ps1
#   Start-ReadAudit -ConversationTag "chat-2026-02-20"
#   # run commands as usual
#   Stop-ReadAudit
#   Get-ReadAuditSummary
#   Get-ReadAuditSessions

# Repo root = one level above this script's directory
$script:RepoRoot = Split-Path $PSScriptRoot -Parent
$script:DefaultLogPath = Join-Path $script:RepoRoot '.audit\read-audit-global.csv'

$script:ReadAuditState = [ordered]@{
    Enabled = $false
    SessionId = $null
    ConversationTag = $null
    LogPath = $null
    OriginalGetContent = $null
    OriginalSelectString = $null
    OriginalRg = $null
}

function New-ReadAuditSessionId {
    return (Get-Date).ToString('yyyyMMdd-HHmmss')
}

function Resolve-ReadAuditLogPath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        $base = Join-Path -Path $script:RepoRoot -ChildPath '.audit'
        if (-not (Test-Path -LiteralPath $base)) {
            New-Item -ItemType Directory -Path $base -Force | Out-Null
        }
        return (Join-Path -Path $base -ChildPath "read-audit-global.csv")
    }

    $parent = Split-Path -Path $Path -Parent
    if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    return $Path
}

function Ensure-ReadAuditLogSchema {
    param([string]$LogPath)

    if (-not (Test-Path -LiteralPath $LogPath)) {
        [pscustomobject]@{
            Timestamp = ''
            SessionId = ''
            ConversationTag = ''
            Command = ''
            Path = ''
            ResolvedPath = ''
            Exists = ''
            WorkingDirectory = ''
        } | Export-Csv -Path $LogPath -NoTypeInformation
        return
    }

    $rows = @(Import-Csv -Path $LogPath)
    if (@($rows).Count -eq 0) {
        [pscustomobject]@{
            Timestamp = ''
            SessionId = ''
            ConversationTag = ''
            Command = ''
            Path = ''
            ResolvedPath = ''
            Exists = ''
            WorkingDirectory = ''
        } | Export-Csv -Path $LogPath -NoTypeInformation
        return
    }

    $first = $rows[0]
    if ($first.PSObject.Properties.Name -contains 'ConversationTag') {
        return
    }

    $upgraded = foreach ($row in $rows) {
        [pscustomobject]@{
            Timestamp = $row.Timestamp
            SessionId = $row.SessionId
            ConversationTag = ''
            Command = $row.Command
            Path = $row.Path
            ResolvedPath = $row.ResolvedPath
            Exists = $row.Exists
            WorkingDirectory = $row.WorkingDirectory
        }
    }

    $upgraded | Export-Csv -Path $LogPath -NoTypeInformation
}

function Write-ReadAuditEntry {
    param(
        [string]$Command,
        [string]$Path
    )

    if (-not $script:ReadAuditState.Enabled) {
        return
    }

    $resolved = $null
    $exists = $false

    if (-not [string]::IsNullOrWhiteSpace($Path)) {
        try {
            $resolvedPath = Resolve-Path -LiteralPath $Path -ErrorAction Stop
            $resolved = $resolvedPath.ProviderPath
            $exists = $true
        }
        catch {
            try {
                $resolved = (Join-Path -Path (Get-Location) -ChildPath $Path)
            }
            catch {
                $resolved = $Path
            }
            $exists = Test-Path -LiteralPath $Path
        }
    }

    [pscustomobject]@{
        Timestamp = (Get-Date).ToString('o')
        SessionId = $script:ReadAuditState.SessionId
        ConversationTag = $script:ReadAuditState.ConversationTag
        Command = $Command
        Path = $Path
        ResolvedPath = $resolved
        Exists = $exists
        WorkingDirectory = (Get-Location).Path
    } | Export-Csv -Path $script:ReadAuditState.LogPath -NoTypeInformation -Append
}

function Get-ReadAuditCandidatePaths {
    param([string[]]$InputArgs)

    $candidates = New-Object System.Collections.Generic.List[string]
    foreach ($arg in $InputArgs) {
        if ([string]::IsNullOrWhiteSpace($arg)) { continue }
        if ($arg.StartsWith('-')) { continue }
        if ($arg -match '^[A-Za-z0-9_./\\:-]+$') {
            $candidates.Add($arg)
        }
    }
    return $candidates
}

function Start-ReadAudit {
    [CmdletBinding()]
    param(
        [string]$LogPath,
        [string]$ConversationTag
    )

    if ($script:ReadAuditState.Enabled) {
        throw 'Read audit is already enabled for this session.'
    }

    $resolvedLogPath = Resolve-ReadAuditLogPath -Path $LogPath

    $script:ReadAuditState.Enabled = $true
    $script:ReadAuditState.SessionId = New-ReadAuditSessionId
    if ([string]::IsNullOrWhiteSpace($ConversationTag)) {
        $script:ReadAuditState.ConversationTag = $script:ReadAuditState.SessionId
    }
    else {
        $script:ReadAuditState.ConversationTag = $ConversationTag
    }
    $script:ReadAuditState.LogPath = $resolvedLogPath

    $script:ReadAuditState.OriginalGetContent = (Get-Command Get-Content -CommandType Cmdlet)
    $script:ReadAuditState.OriginalSelectString = (Get-Command Select-String -CommandType Cmdlet)
    $script:ReadAuditState.OriginalRg = (Get-Command rg -ErrorAction SilentlyContinue)

    Ensure-ReadAuditLogSchema -LogPath $script:ReadAuditState.LogPath

    function global:Get-Content {
        [CmdletBinding(DefaultParameterSetName='Path')]
        param(
            [Parameter(ParameterSetName='Path', Position=0, ValueFromPipeline=$true, ValueFromPipelineByPropertyName=$true)]
            [string[]]$Path,
            [Parameter(ParameterSetName='LiteralPath', Mandatory=$true)]
            [string[]]$LiteralPath,
            [switch]$Raw,
            [string]$Encoding,
            [int]$TotalCount,
            [int]$Tail,
            [switch]$ReadCount,
            [switch]$Wait
        )

        $paths = @()
        if ($PSCmdlet.ParameterSetName -eq 'LiteralPath') { $paths = $LiteralPath } else { $paths = $Path }
        foreach ($p in $paths) { Write-ReadAuditEntry -Command 'Get-Content' -Path $p }

        Microsoft.PowerShell.Management\Get-Content @PSBoundParameters
    }

    function global:Select-String {
        [CmdletBinding(DefaultParameterSetName='File')]
        param(
            [Parameter(Position=0)] [string[]]$Pattern,
            [Parameter(ParameterSetName='File', Position=1)] [string[]]$Path,
            [Parameter(ParameterSetName='LiteralFile')] [string[]]$LiteralPath,
            [switch]$CaseSensitive,
            [switch]$SimpleMatch,
            [switch]$AllMatches,
            [switch]$List,
            [switch]$Quiet,
            [switch]$NoEmphasis,
            [switch]$NotMatch
        )

        $paths = @()
        if ($PSCmdlet.ParameterSetName -eq 'LiteralFile') { $paths = $LiteralPath } else { $paths = $Path }
        foreach ($p in $paths) { Write-ReadAuditEntry -Command 'Select-String' -Path $p }

        Microsoft.PowerShell.Utility\Select-String @PSBoundParameters
    }

    if ($script:ReadAuditState.OriginalRg) {
        function global:rg {
            [CmdletBinding(PositionalBinding=$false)]
            param(
                [Parameter(ValueFromRemainingArguments=$true)]
                [string[]]$RemainingArgs
            )

            $candidates = Get-ReadAuditCandidatePaths -InputArgs $RemainingArgs
            foreach ($c in $candidates) {
                if (Test-Path -LiteralPath $c) {
                    Write-ReadAuditEntry -Command 'rg' -Path $c
                }
            }

            & $script:ReadAuditState.OriginalRg.Source @RemainingArgs
        }
    }

    Write-Host ("Read audit enabled. Log: " + $script:ReadAuditState.LogPath)
    return $script:ReadAuditState.LogPath
}

function Stop-ReadAudit {
    [CmdletBinding()]
    param()

    if (-not $script:ReadAuditState.Enabled) {
        throw 'Read audit is not enabled.'
    }

    Remove-Item Function:\Get-Content -ErrorAction SilentlyContinue
    Remove-Item Function:\Select-String -ErrorAction SilentlyContinue
    if ($script:ReadAuditState.OriginalRg) {
        Remove-Item Function:\rg -ErrorAction SilentlyContinue
    }

    $logPath = $script:ReadAuditState.LogPath

    $script:ReadAuditState.Enabled = $false
    $script:ReadAuditState.SessionId = $null
    $script:ReadAuditState.ConversationTag = $null
    $script:ReadAuditState.LogPath = $null
    $script:ReadAuditState.OriginalGetContent = $null
    $script:ReadAuditState.OriginalSelectString = $null
    $script:ReadAuditState.OriginalRg = $null

    Write-Host ("Read audit disabled. Log saved at: " + $logPath)
}

function Get-ReadAuditSummary {
    [CmdletBinding()]
    param(
        [string]$LogPath = $script:DefaultLogPath
    )

    if (-not (Test-Path -LiteralPath $LogPath)) {
        throw ("Log file not found: " + $LogPath)
    }

    $rows = @(Import-Csv -Path $LogPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_.Timestamp) })

    $totalReads = @($rows).Count
    $uniqueFiles = @(
        $rows |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_.ResolvedPath) } |
            Select-Object -ExpandProperty ResolvedPath -Unique
    ).Count

    [pscustomobject]@{
        LogPath = (Resolve-Path -LiteralPath $LogPath).ProviderPath
        TotalReadEvents = $totalReads
        UniqueFilesRead = $uniqueFiles
    }
}

function Get-ReadAuditSessions {
    [CmdletBinding()]
    param(
        [string]$LogPath = $script:DefaultLogPath
    )

    if (-not (Test-Path -LiteralPath $LogPath)) {
        throw ("Log file not found: " + $LogPath)
    }

    $rows = @(Import-Csv -Path $LogPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_.Timestamp) })
    if (@($rows).Count -eq 0) {
        return @()
    }

    $rows |
        Group-Object -Property SessionId |
        ForEach-Object {
            $sessionRows = @($_.Group | Sort-Object Timestamp)
            $first = $sessionRows[0]
            $last = $sessionRows[-1]
            $tag = ''
            if ($first.PSObject.Properties.Name -contains 'ConversationTag') {
                $tag = $first.ConversationTag
            }
            $uniqueFiles = @(
                $sessionRows |
                    Where-Object { -not [string]::IsNullOrWhiteSpace($_.ResolvedPath) } |
                    Select-Object -ExpandProperty ResolvedPath -Unique
            ).Count

            [pscustomobject]@{
                SessionId = $_.Name
                ConversationTag = $tag
                StartTimestamp = $first.Timestamp
                EndTimestamp = $last.Timestamp
                TotalReadEvents = @($sessionRows).Count
                UniqueFilesRead = $uniqueFiles
            }
        } |
        Sort-Object StartTimestamp
}
