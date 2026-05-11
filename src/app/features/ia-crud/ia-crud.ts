import { Component, OnInit, inject, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, Play, Edit, Trash2, Bot, Mic, Mail } from 'lucide-angular';
import Swal from 'sweetalert2';
import { IaResponseService } from '../../core/services/ia-response.service';
import { ApiResponse } from '../../core/models/ia-response';
import { SoundRequest } from '../../core/models/dto/sound-request';

@Component({
  selector: 'app-ia-crud',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatDialogModule,
    LucideAngularModule
  ],
  templateUrl: './ia-crud.html',
  styleUrls: ['./ia-crud.scss']
})
export class IaCrudComponent implements OnInit {
  private iaService = inject(IaResponseService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  responses: ApiResponse[] = [];
  displayedColumns: string[] = ['apiName', 'prompt', 'timestamp', 'acciones'];
  
  // Dos formularios independientes
  elevenLabsForm: FormGroup;
  zeroBounceForm: FormGroup;
  editingId: string | null = null;

  // Referencias a los modales en el HTML
  @ViewChild('elevenLabsModal') elevenLabsModal!: TemplateRef<any>;
  @ViewChild('zeroBounceModal') zeroBounceModal!: TemplateRef<any>;

  // Iconos
  readonly Play = Play;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Bot = Bot;
  readonly Mic = Mic;
  readonly Mail = Mail;

  constructor() {
    // Formulario para Audio
    this.elevenLabsForm = this.fb.group({
      prompt: ['', Validators.required],
      durationSeconds: [5, [Validators.required, Validators.min(1)]],
      promptInfluence: [0.5, [Validators.required, Validators.min(0), Validators.max(1)]]
    });

    // Formulario para Email (ZeroBounce no necesita duración ni influencia)
    this.zeroBounceForm = this.fb.group({
      prompt: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.iaService.getResponses().subscribe(data => {
      this.responses = data;
      this.cdr.detectChanges();
    });
  }

  // --- Funciones para abrir Modales ---
  openElevenLabsDialog() {
    this.editingId = null;
    this.elevenLabsForm.reset({ durationSeconds: 5, promptInfluence: 0.5 });
    this.dialog.open(this.elevenLabsModal, { width: '500px' });
  }

  openZeroBounceDialog() {
    this.editingId = null;
    this.zeroBounceForm.reset();
    this.dialog.open(this.zeroBounceModal, { width: '400px' });
  }

  // --- Procesar Formularios ---
  onSubmitElevenLabs() {
    if (this.elevenLabsForm.invalid) return;
    this.dialog.closeAll();
    
    const soundReq: SoundRequest = {
      prompt: this.elevenLabsForm.value.prompt,
      durationSeconds: this.elevenLabsForm.value.durationSeconds,
      promptInfluence: this.elevenLabsForm.value.promptInfluence
    };
    
    this.processRequest(soundReq, 'ElevenLabs');
  }

  onSubmitZeroBounce() {
    if (this.zeroBounceForm.invalid) return;
    this.dialog.closeAll();

    const request = {
      prompt: this.zeroBounceForm.value.prompt,
      durationSeconds: 0, 
      promptInfluence: 0 
    };

    this.processRequest(request, 'ZeroBounce');
  }

  // --- Lógica del Backend ---
  private processRequest(reqData: any, apiName: string) {
    Swal.fire({
      title: 'Procesando...',
      text: `Conectando con ${apiName}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    if (this.editingId) {
      this.iaService.updateRequest(this.editingId, reqData).subscribe({
        next: () => this.onSuccess('Consulta actualizada correctamente'),
        error: () => Swal.fire('Error', 'Fallo al actualizar', 'error')
      });
    } else {
      this.iaService.createRequest(reqData, apiName).subscribe({
        next: () => this.onSuccess('Consulta procesada y guardada'),
        error: () => Swal.fire('Error', 'Fallo en la conexión API', 'error')
      });
    }
  }

  onSuccess(msg: string) {
    Swal.fire('¡Éxito!', msg, 'success');
    this.loadData();
  }

  deleteResponse(id: string) {
    Swal.fire({
      title: '¿Eliminar registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.iaService.deleteResponse(id).subscribe(() => {
          Swal.fire('Eliminado', 'Registro borrado.', 'success');
          this.loadData();
        });
      }
    });
  }

  playAudio(response: ApiResponse) {
    if (response.audioData) {
      this.iaService.playBase64Audio(response.audioData);
    } else {
      Swal.fire('Sin Audio', 'Este registro no contiene datos de audio.', 'info');
    }
  }

  editResponse(response: ApiResponse) {
    this.editingId = response.id!;
    if (response.apiName === 'ElevenLabs') {
      this.elevenLabsForm.patchValue({
        prompt: response.requestData,
        durationSeconds: 5,
        promptInfluence: 0.5
      });
      this.dialog.open(this.elevenLabsModal, { width: '500px' });
    } else {
      this.zeroBounceForm.patchValue({
        prompt: response.requestData
      });
      this.dialog.open(this.zeroBounceModal, { width: '400px' });
    }
  }
}