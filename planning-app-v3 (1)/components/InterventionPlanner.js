import React, { useState } from 'react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx'
import { saveAs } from 'file-saver'

const lieuxFixes = ["École Bayard", "École Jean Renoir", "École Alice Guy", "Crèche Robert Desnos"]

export default function InterventionPlanner() {
  const [interventions, setInterventions] = useState([])
  const [form, setForm] = useState({
    lieu: '',
    type: '',
    duree: '',
    urgence: '',
    techniciens: '',
    date: ''
  })
  const [planning, setPlanning] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const addIntervention = () => {
    setInterventions([...interventions, form])
    setForm({ lieu: '', type: '', duree: '', urgence: '', techniciens: '', date: '' })
  }

  const generatePlanning = async () => {
    const res = await fetch('/api/generate-planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interventions })
    })
    const data = await res.json()
    setPlanning(data.result)
  }

  const downloadWord = () => {
    const rows = interventions.map((item) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(item.date)] }),
          new TableCell({ children: [new Paragraph(item.lieu)] }),
          new TableCell({ children: [new Paragraph(item.type)] }),
          new TableCell({ children: [new Paragraph(item.duree + 'h')] }),
          new TableCell({ children: [new Paragraph(item.urgence)] }),
          new TableCell({ children: [new Paragraph(item.techniciens)] }),
        ],
      })
    )

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'Planning des interventions', heading: 'Heading1' }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Date')] }),
                  new TableCell({ children: [new Paragraph('Lieu')] }),
                  new TableCell({ children: [new Paragraph('Type')] }),
                  new TableCell({ children: [new Paragraph('Durée')] }),
                  new TableCell({ children: [new Paragraph('Urgence')] }),
                  new TableCell({ children: [new Paragraph('Techniciens')] }),
                ]
              }),
              ...rows
            ]
          })
        ]
      }]
    })

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'planning_interventions.docx')
    })
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Planificateur d'interventions</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <select name="lieu" value={form.lieu} onChange={handleChange} className="border p-2 rounded">
          <option value="">Sélectionner un lieu</option>
          {lieuxFixes.map((lieu, idx) => <option key={idx} value={lieu}>{lieu}</option>)}
          <option value="__autre__">Autre (saisie manuelle)</option>
        </select>
        {form.lieu === '__autre__' && (
          <Input name="lieu" placeholder="Saisir l'adresse" value={form.lieu} onChange={handleChange} />
        )}
        <Input name="type" placeholder="Type d'intervention" value={form.type} onChange={handleChange} />
        <Input name="duree" placeholder="Durée estimée (h)" value={form.duree} onChange={handleChange} />
        <select name="urgence" value={form.urgence} onChange={handleChange} className="border p-2 rounded">
          <option value="">Niveau d'urgence</option>
          <option value="faible">Faible</option>
          <option value="moyenne">Moyenne</option>
          <option value="élevée">Élevée</option>
        </select>
        <Input name="techniciens" placeholder="Techniciens nécessaires" value={form.techniciens} onChange={handleChange} />
        <Input type="date" name="date" value={form.date} onChange={handleChange} />
      </div>
      <Button onClick={addIntervention}>Ajouter l'intervention</Button>

      <h2 className="text-xl font-semibold mt-6 mb-2">Interventions enregistrées</h2>
      {interventions.map((item, i) => (
        <Card key={i} className="mb-2">
          <CardContent className="p-2 text-sm">
            📍 {item.lieu} — {item.type} ({item.duree}h) — Urgence : {item.urgence} — 👥 {item.techniciens} — 📅 {item.date}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4 mt-4">
        <Button onClick={generatePlanning}>Générer le planning</Button>
        <Button onClick={downloadWord}>Télécharger en Word</Button>
      </div>

      {planning && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Planning généré</h2>
          <Textarea readOnly value={planning} className="w-full h-64" />
        </div>
      )}
    </div>
  )
}
