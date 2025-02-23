"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import VoiceComponent from "@/components/VoiceComponent"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Pencil } from "lucide-react"
import EventTable from "@/components/ui/EventTable"
import { TableProvider } from "@/components/TableContext"
import { ConversationProvider, useConversation } from "@/components/ConversationContext"

interface OperationDetails {
  patient_first_name: string
  patient_last_name: string
  patient_id: string
  operation_type: string
}

interface OperationIdProps {
  operationId: string | null // Remove undefined from possible types
  operationDetails: OperationDetails
}

const TranscriptionContent = ({ operationId, operationDetails }: OperationIdProps) => {
  const { conversationId } = useConversation()

  const downloadReport = async () => {
    if (!conversationId) {
      console.error("No active conversation found")
      return
    }

    try {
      const response = await fetch("http://ec2-52-91-35-107.compute-1.amazonaws.com:5000/api/downloadReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          operationId,
          surgeryDetails: operationDetails,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to download report")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `surgery_report_${operationDetails.patient_first_name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading report:", error)
    }
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <VoiceComponent operationId={operationId} />
      </div>
      <Button
        onClick={downloadReport}
        variant="outline"
        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
        disabled={!conversationId}
      >
        <Download className="w-4 h-4 mr-2" />
        Download Report
      </Button>
    </div>
  )
}

interface RoomContentProps {
  params: {
    id: string
  }
}

export function RoomContent({ params }: RoomContentProps) {
  const { id } = params
  const rawParams = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("surgery")
  const [isRecording] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [operationDetails, setOperationDetails] = useState<OperationDetails>({
    patient_first_name: "",
    patient_last_name: "",
    patient_id: "",
    operation_type: "",
  })
  const [userEmail, setUserId] = useState<string | null>(null)
  const [operationId, setOperationId] = useState<string | null>(null)

  const roomId = rawParams?.id || id

  useEffect(() => {
    const uid = sessionStorage.getItem("userEmail")
    setUserId(uid)
  }, [])

  const createOperation = async (details: OperationDetails) => {
    try {
      const userResponse = await fetch("http://ec2-52-91-35-107.compute-1.amazonaws.com:5000/api/userId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
        }),
      })

      if (!userResponse.ok) {
        console.error("Failed to fetch user ID from the database")
        return
      }

      const userData = await userResponse.json()
      const user_id = userData.user_id

      const operationResponse = await fetch("http://ec2-52-91-35-107.compute-1.amazonaws.com:5000/api/createOperation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomId,
          userId: user_id,
          patientFirstName: details.patient_first_name,
          patientLastName: details.patient_last_name,
          patientId: details.patient_id,
          operationType: details.operation_type,
        }),
      })

      if (!operationResponse.ok) {
        console.error("Failed to create operation")
        return
      }

      const operationData = await operationResponse.json()
      setOperationId(operationData.operationId)
      console.log("Operation created successfully:", operationData.operationId)
    } catch (error) {
      console.error("Error creating operation:", error)
    }
  }

  const handleSubmitOperationDetails = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const newOperationDetails: OperationDetails = {
      patient_first_name: formData.get("patient_first_name") as string,
      patient_last_name: formData.get("patient_last_name") as string,
      patient_id: formData.get("patient_id") as string,
      operation_type: formData.get("operation_type") as string,
    }
    setOperationDetails(newOperationDetails)
    setFormSubmitted(true)
    createOperation(newOperationDetails)
    setActiveTab("transcription")
  }

  if (!roomId) return <p>Loading...</p>

  return (
    <TableProvider>
      <ConversationProvider>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rooms
              </Button>
              <h1 className="text-2xl font-bold text-blue-900">Operating Room {id}</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-blue-50">
                <TabsTrigger
                  value="surgery"
                  className="data-[state=active]:bg-white"
                  disabled={formSubmitted && isRecording}
                >
                  Operation Details
                </TabsTrigger>
                <TabsTrigger value="transcription" className="data-[state=active]:bg-white" disabled={!formSubmitted}>
                  Live Transcription
                </TabsTrigger>
              </TabsList>

              <TabsContent value="surgery">
                <Card className="border-blue-100 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Patient & Operation Information</CardTitle>
                    <CardDescription className="text-blue-600">Enter patient and operation details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitOperationDetails} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient_first_name" className="text-gray-700">
                            First Name
                          </Label>
                          <Input
                            id="patient_first_name"
                            name="patient_first_name"
                            className="border-blue-100"
                            required
                            defaultValue={operationDetails.patient_first_name}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="patient_last_name" className="text-gray-700">
                            Last Name
                          </Label>
                          <Input
                            id="patient_last_name"
                            name="patient_last_name"
                            className="border-blue-100"
                            required
                            defaultValue={operationDetails.patient_last_name}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient_id" className="text-gray-700">
                            Patient ID
                          </Label>
                          <Input
                            id="patient_id"
                            name="patient_id"
                            className="border-blue-100"
                            required
                            defaultValue={operationDetails.patient_id}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="operation_type" className="text-gray-700">
                            Operation Type
                          </Label>
                          <Input
                            id="operation_type"
                            name="operation_type"
                            className="border-blue-100"
                            required
                            defaultValue={operationDetails.operation_type}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        {formSubmitted ? "Update Operation Details" : "Start Operation"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcription">
                <Card className="border-blue-100 shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-blue-900">Live Transcription</CardTitle>
                        <CardDescription className="text-blue-600">Voice-assisted documentation</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => setActiveTab("surgery")}
                        disabled={isRecording}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Patient:</span>{" "}
                          <span className="text-gray-700">
                            {operationDetails.patient_first_name} {operationDetails.patient_last_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">ID:</span>{" "}
                          <span className="text-gray-700">{operationDetails.patient_id}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Operation:</span>{" "}
                          <span className="text-gray-700">{operationDetails.operation_type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px] rounded-lg border border-blue-100 bg-white p-4 overflow-y-auto">
                      <EventTable />
                    </div>

                    <TranscriptionContent
                      operationId={operationId || null} // Ensure undefined is converted to null
                      operationDetails={operationDetails}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ConversationProvider>
    </TableProvider>
  )
}