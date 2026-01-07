import SettingsForm from "./_components/settings-form";

export const metadata = {
    title:"Settings | Vehiql Admin",
    description: "Manage dealership worsihp hours and admin users"
}

const SettingPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <SettingsForm/>
        </div>
    )
}

export default SettingPage;