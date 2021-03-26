/// FHIRリポジトリ（FHIRSERVER）用ネームスペース作成／初期設定用クラス
/// （GUIの提供あり　開発環境テンプレートでは自動生成のため以下クラスを用意） 
Class ISJ.Setup
{

/// FHIR R4リポジトリを作成するため、ネームスペースとFHIR用構成（RESTのベースURLなど）を作成
/// アプリケーションサンプル（Interoperabilityメニューのプロダクション）をインポート
ClassMethod setUpFHIR(ns As %String = "r4fhirnamespace") As %Status
{
   
    #dim ex As %Exception.AbstractException
    set status=$$$OK

    try {

        // ネームスペース作成（ユーティリティがあるHSLIBに移動してユーティリティ実行）
        set $namespace = "HSLIB"
        // サンプルインポートのためのベースディレクトリのパスを設定
        set baseDir = "/opt/app/"
        // ネームスペース名：R4FHIRNamespace　を作成
        set status = ##class(HS.HC.Util.Installer).InstallFoundation(ns)
        $$$ThrowOnError(status)

        // 作成したR4FHIRNamespaceに移動し、src以下のソースコードをインポート
        set $namespace = ns
        do $system.OBJ.LoadDir(baseDir_ "src/Solution/", "ck")
        do $system.OBJ.Compile("Solution.FromFhirObsToSIUS12","ck")

        // FHIR対応用ネームスペース作成のために必要なインストールを実施
        do ##class(HS.FHIRServer.Installer).InstallNamespace()

        // FHIRリポジトリ用RESTのベースパス作成準備
        set tFHIRApp = "/csp/healthshare/"_ns_"/fhir/r4"
        set tStrategyClass = "HS.FHIRServer.Storage.Json.InteractionsStrategy"
        set tMetadataConfigKey = "HL7v40"

        // FHIRサーバ機能を作成したネームスペースにインストール
        do ##class(HS.FHIRServer.Installer).InstallInstance(tFHIRApp, tStrategyClass, tMetadataConfigKey,"",0)

        // FHIRアプリケーション用の構成
        set strategy = ##class(HS.FHIRServer.API.InteractionsStrategy).GetStrategyForEndpoint(tFHIRApp) 
        set configData = strategy.GetServiceConfigData() 
        set configData.DebugMode = 4   

        
        set cspApp = ##class(HS.Util.RESTCSPConfig).URLIndexOpen(tFHIRApp)
        set cspApp.ServiceConfigName = "HS.FHIRServer.Interop.Service"

        set status = cspApp.%Save()
        $$$ThrowOnError(status)

        do strategy.SaveServiceConfigData(configData)

        //完成版プロダクションの開始
        do ##class(Solution.FoundationProduction).Start()
        //自動開始の設定
        do ##class(Ens.Director).SetAutoStart("Solution.FoundationProduction")
        $$$ThrowOnError(status)
    }
    catch ex {
        set status=ex.AsStatus()
    }
    return status
}

/// TRYIRIS（https://www.intersystems.com/jp/TRY)）の環境で動かす場合の初期設定用メソッド
/// FHIRR4リソースリポジトリの作成とアプリケーションサンプル（Interoperabilityメニューのプロダクション）をインポート
ClassMethod setUpLearningLab() As %Status
{
    set $namespace = "HSLIB"
    set baseDir = "/home/project/shared/IRIS-FHIR-Oximeter-Template/"

    set status = ##class(HS.HC.Util.Installer).InstallFoundation("R4FHIRNamespace")
    $$$ThrowOnError(status)

    // Switch to newly created namespace
    set $namespace = "R4FHIRNamespace"
    do $system.OBJ.LoadDir(baseDir _ "src/Solution/", "ck")
    do $system.OBJ.Compile("Solution.FromFhirObsToSIUS12","ck")

    // Install elements that are required for a FHIR-enabled namespace
    do ##class(HS.FHIRServer.Installer).InstallNamespace()

    // Declare installation configuration variables
    set tFHIRApp = "/csp/healthshare/r4fhirnamespace/fhir/r4"
    set tStrategyClass = "HS.FHIRServer.Storage.Json.InteractionsStrategy"
    set tMetadataConfigKey = "HL7v40"

    // Install an instance of a FHIR Service into the current namespace
    do ##class(HS.FHIRServer.Installer).InstallInstance(tFHIRApp, tStrategyClass, tMetadataConfigKey,"",0)

    // Configure FHIR app
    set strategy = ##class(HS.FHIRServer.API.InteractionsStrategy).GetStrategyForEndpoint(tFHIRApp) 
    set configData = strategy.GetServiceConfigData() 
    set configData.DebugMode = 4   

    
    set cspApp = ##class(HS.Util.RESTCSPConfig).URLIndexOpen(tFHIRApp)
    set cspApp.ServiceConfigName = "HS.FHIRServer.Interop.Service"

    set status = cspApp.%Save()
    $$$ThrowOnError(status)

    do strategy.SaveServiceConfigData(configData)

    //完成版プロダクションの開始
    do ##class(Solution.FoundationProduction).Start()
    //自動開始の設定
    do ##class(Ens.Director).SetAutoStart("Solution.FoundationProduction")
    $$$ThrowOnError(status)
    return status
}

}
