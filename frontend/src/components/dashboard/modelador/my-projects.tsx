import { Plus } from 'lucide-react'
import { Button } from '@src/components/ui/common/button'
import React from 'react'

const MyProjects = () => {
  return (
    <div className='w-full'>
        <div className='flex w-full justify-between border-b border-accent-100 py-2' > 
            <h1 className='text-2xl font-bold'>Mis proyectos</h1>
        </div>
        <div>
            <div>
            list 
            </div>
            <Button className='uppercase'>
            <Plus />
                
                Crear proyecto
            </Button>
        </div>
        
    </div>
  )
}

export default MyProjects